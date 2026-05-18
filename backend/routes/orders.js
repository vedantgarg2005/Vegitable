const express = require('express');
const Order = require('../models/Order');
const Fleet = require('../models/Fleet');
const { auth } = require('../middleware/auth');

const router = express.Router();

const FREE_DELIVERY_THRESHOLD = 199;
const STANDARD_DELIVERY_FEE = 30;

function calculateDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

// Get all orders (admin) - must be before /:id
router.get('/admin', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer items.menuItem deliveryAgent')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { pricing, items, orderType, payment, delivery, promoCode, recipientName, recipientPhone, isGift } = req.body;

    const subtotal = pricing?.subtotal;
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return res.status(400).json({ message: 'Invalid subtotal' });
    }
    if (!orderType) {
      return res.status(400).json({ message: 'orderType is required' });
    }
    if (!payment?.method) {
      return res.status(400).json({ message: 'payment.method is required' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    const deliveryFee = orderType === 'delivery' ? calculateDeliveryFee(subtotal) : 0;
    const discount = pricing?.discount || 0;
    const total = subtotal + deliveryFee - discount;

    const order = new Order({
      orderType,
      items,
      customer: req.userId,
      pricing: { subtotal, tax: 0, deliveryFee, discount, total },
      payment: { method: payment.method, status: 'pending' },
      delivery: delivery || {},
      ...(promoCode ? { promoCode } : {}),
      ...(recipientName ? { recipientName } : {}),
      ...(recipientPhone ? { recipientPhone } : {}),
      ...(isGift ? { isGift } : {}),
    });

    await order.save();
    await order.populate('items.menuItem customer');

    // Auto-assign nearest available delivery agent
    if (order.orderType === 'delivery') {
      const agent = await Fleet.findOne({ status: 'available', isActive: true }).populate('driver');
      if (agent) {
        order.delivery.partner = agent.driver._id;
        order.status.history.push({ status: 'confirmed', note: `Assigned to ${agent.driver.name}` });
        order.status.current = 'confirmed';
        agent.status = 'busy';
        agent.currentOrder = order._id;
        await Promise.all([order.save(), agent.save()]);
        if (req.io) req.io.to(String(agent.driver._id)).emit('new-assignment', order);
      }
    }

    if (req.io) req.io.emit('new-order', order);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get assigned orders for delivery partner
router.get('/assigned', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      'delivery.partner': req.userId,
      'status.current': { $in: ['confirmed', 'picked_up', 'out_for_delivery'] }
    }).populate('items.menuItem').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.userId })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status.current = status;
    order.status.history.push({ status, note, timestamp: new Date() });

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      await Fleet.findOneAndUpdate(
        { currentOrder: order._id },
        { status: 'available', currentOrder: null }
      );
    }

    await order.save();

    if (req.io) req.io.to(req.params.id).emit('order-status-update', { orderId: req.params.id, status });

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single order (admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer items.menuItem delivery.partner');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add item to existing order
router.post('/:id/items', auth, async (req, res) => {
  try {
    const { menuItem, quantity, price, addOns, specialInstructions } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status.current === 'delivered') {
      return res.status(400).json({ message: 'Cannot add items to a delivered order' });
    }

    const newItem = {
      menuItem,
      quantity,
      price,
      addOns: addOns || [],
      specialInstructions
    };

    order.items.push(newItem);

    // Recalculate pricing with free delivery check
    const itemTotal = price * quantity + (addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0);
    order.pricing.subtotal += itemTotal;
    order.pricing.deliveryFee = calculateDeliveryFee(order.pricing.subtotal);
    order.pricing.tax = 0;
    order.pricing.total = order.pricing.subtotal + order.pricing.deliveryFee - order.pricing.discount;
    
    await order.save();
    await order.populate('items.menuItem customer');
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add charge to existing order
router.post('/:id/charges', auth, async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status.current === 'delivered') {
      return res.status(400).json({ message: 'Cannot add charges to a delivered order' });
    }

    // Add charge based on type
    if (type === 'delivery') {
      order.pricing.deliveryFee += amount;
    } else {
      // For other charges, add to subtotal
      order.pricing.subtotal += amount;
    }
    
    // Recalculate total
    order.pricing.tax = 0;
    order.pricing.total = order.pricing.subtotal + order.pricing.deliveryFee - order.pricing.discount;
    
    // Add to status history for tracking
    order.status.history.push({
      status: order.status.current,
      note: `${description}: ₹${amount} added`,
      timestamp: new Date()
    });
    
    await order.save();
    await order.populate('items.menuItem customer');
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const Order = require('../models/Order');
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
    const { pricing, ...rest } = req.body;

    const subtotal = pricing?.subtotal;
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return res.status(400).json({ message: 'Invalid subtotal' });
    }

    const deliveryFee = calculateDeliveryFee(subtotal);
    const tax = Math.round(subtotal * 0.1);
    const discount = pricing?.discount || 0;
    const total = subtotal + tax + deliveryFee - discount;

    const order = new Order({
      ...rest,
      customer: req.userId,
      pricing: { subtotal, tax, deliveryFee, discount, total },
    });

    await order.save();
    await order.populate('items.menuItem customer');

    req.io.emit('new-order', order);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    
    order.orderStatus = status;
    order.timeline.push({ status, note });
    
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }
    
    await order.save();
    
    // Emit real-time update
    req.io.to(req.params.id).emit('order-status-update', { orderId: req.params.id, status });
    
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
    order.pricing.tax = Math.round(order.pricing.subtotal * 0.1);
    order.pricing.total = order.pricing.subtotal + order.pricing.tax + order.pricing.deliveryFee - order.pricing.discount;
    
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

    // Add charge based on type
    if (type === 'delivery') {
      order.pricing.deliveryFee += amount;
    } else {
      // For other charges, add to subtotal
      order.pricing.subtotal += amount;
    }
    
    // Recalculate total
    order.pricing.tax = Math.round(order.pricing.subtotal * 0.1);
    order.pricing.total = order.pricing.subtotal + order.pricing.tax + order.pricing.deliveryFee - order.pricing.discount;
    
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
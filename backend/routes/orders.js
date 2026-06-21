const express = require('express');
const Order = require('../models/Order');
const Fleet = require('../models/Fleet');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const { auth } = require('../middleware/auth');

const router = express.Router();

const FREE_DELIVERY_THRESHOLD = 199;
const STANDARD_DELIVERY_FEE = 20;
const MIN_ORDER_VALUE = 99;

function calculateDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

// Get all orders (admin) - must be before /:id
router.get('/admin', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name phone email')
      .populate('delivery.partner', 'name phone')
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
    if (typeof subtotal !== 'number' || subtotal <= 0)
      return res.status(400).json({ message: 'Invalid subtotal' });
    if (subtotal < MIN_ORDER_VALUE)
      return res.status(400).json({ message: `Minimum order value is ₹${MIN_ORDER_VALUE}` });
    if (!orderType)
      return res.status(400).json({ message: 'orderType is required' });
    if (!payment?.method)
      return res.status(400).json({ message: 'payment.method is required' });
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Order must have at least one item' });

    // Validate wallet balance if wallet is being used
    const walletAmount = Number(payment.walletAmount) || 0;
    if (walletAmount > 0) {
      const user = await User.findById(req.userId).select('wallet');
      if (!user || user.wallet.balance < walletAmount)
        return res.status(400).json({ message: 'Insufficient wallet balance' });
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

    // Deduct wallet balance atomically
    if (walletAmount > 0) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'wallet.balance': -walletAmount },
        $push: {
          'wallet.transactions': {
            type: 'debit',
            amount: walletAmount,
            description: `Order #${order.orderNumber}`,
          },
        },
      });
    }

    // Track promo code usage
    if (promoCode?.code) {
      await PromoCode.findOneAndUpdate(
        { code: promoCode.code.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // Auto-assign available delivery agent
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
      'status.current': { $in: ['confirmed', 'picked_up', 'out_for_delivery'] },
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (admin or customer cancel)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Customers may only cancel their own orders at early stages
    const isOwner = String(order.customer) === String(req.userId);
    if (isOwner && status !== 'cancelled')
      return res.status(403).json({ message: 'Customers can only cancel orders' });
    if (isOwner && !['placed', 'confirmed'].includes(order.status.current))
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });

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

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('delivery.partner', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const { createCashfreeOrder, verifyCashfreePayment } = require('../services/cashfree');

const router = express.Router();

// Create Cashfree payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('customer');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const cfOrder = await createCashfreeOrder({
      orderId: `${order.orderNumber}_${Date.now()}`,
      amount: order.pricing.total,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
    });

    res.json({ paymentSessionId: cfOrder.payment_session_id, cfOrderId: cfOrder.order_id });
  } catch (error) {
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
});

// Verify payment status
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, cfOrderId } = req.body;
    console.log('[Verify] orderId:', orderId, 'cfOrderId:', cfOrderId);

    const cfOrder = await verifyCashfreePayment(cfOrderId);

    if (cfOrder.order_status === 'PAID') {
      await Order.findByIdAndUpdate(orderId, { 'payment.status': 'completed' });
      return res.json({ success: true, status: 'PAID' });
    }

    res.json({ success: false, status: cfOrder.order_status });
  } catch (error) {
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
});

module.exports = router;

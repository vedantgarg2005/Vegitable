const express = require('express');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get real-time order tracking
router.get('/:orderId/track', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('delivery.partner', 'name phone')
      .populate('customer', 'name phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status.current,
      estimatedTime: order.estimatedDeliveryTime,
      deliveryPartner: order.delivery.partner,
      customerLocation: order.delivery.address.coordinates,
      partnerLocation: null, // updated via socket
      statusHistory: order.status.history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update delivery partner location (protected)
router.post('/:orderId/location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    req.app.get('io').to(req.params.orderId).emit('partner_location', { lat, lng });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const Fleet = require('../models/Fleet');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all delivery agents
router.get('/', auth, async (req, res) => {
  try {
    const agents = await Fleet.find().populate('driver');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add delivery agent
router.post('/agent', auth, async (req, res) => {
  try {
    const agent = new User({
      ...req.body,
      role: 'delivery_partner'
    });
    await agent.save();
    
    const fleetRecord = new Fleet({
      driver: agent._id,
      vehicleType: req.body.vehicleType,
      vehicleNumber: req.body.vehicleNumber,
      licenseNumber: req.body.licenseNumber
    });
    await fleetRecord.save();
    
    res.status(201).json({ agent, fleetRecord });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Auto-create fleet record if missing
async function getOrCreateFleet(userId) {
  let fleet = await Fleet.findOne({ driver: userId });
  if (!fleet) {
    fleet = new Fleet({
      driver: userId,
      vehicleType: 'bike',
      vehicleNumber: 'PENDING',
      licenseNumber: 'PENDING',
    });
    await fleet.save();
  }
  return fleet;
}

// Update agent location
router.patch('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const fleet = await getOrCreateFleet(req.userId);
    fleet.currentLocation = { latitude, longitude, lastUpdated: new Date() };
    await fleet.save();
    res.json(fleet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update agent status
router.patch('/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const fleet = await getOrCreateFleet(req.userId);
    fleet.status = status;
    await fleet.save();
    res.json(fleet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Assign order to agent
router.post('/assign/:orderId', auth, async (req, res) => {
  try {
    const { agentId } = req.body;
    const order = await Order.findById(req.params.orderId);
    const fleet = await Fleet.findOne({ driver: agentId });
    
    if (!order || !fleet) return res.status(404).json({ message: 'Order or agent not found' });
    
    order.delivery.partner = agentId;
    fleet.currentOrder = req.params.orderId;
    fleet.status = 'busy';
    
    await order.save();
    await fleet.save();
    
    res.json({ order, fleet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get agent performance
router.get('/performance', auth, async (req, res) => {
  try {
    const deliveredOrders = await Order.find({
      'delivery.partner': req.userId,
      'status.current': 'delivered'
    });
    
    const totalDeliveries = deliveredOrders.length;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayDeliveries = deliveredOrders.filter(o => new Date(o.updatedAt) >= todayStart).length;
    const todayEarnings = todayDeliveries * 50;
    const totalEarnings = totalDeliveries * 50;

    const fleet = await Fleet.findOne({ driver: req.userId });
    
    res.json({
      totalDeliveries,
      todayDeliveries,
      todayEarnings,
      totalEarnings,
      rating: fleet?.deliveryStats?.averageRating || 0,
      acceptanceRate: 100
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const PromoCode = require('../models/PromoCode');
const Fleet = require('../models/Fleet');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const RestaurantSettings = require('../models/RestaurantSettings');

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
  }),
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// In-memory delivery control state (persists while server is running)
let deliveryEnabled = true;

// Test Login (for development/testing)
router.post('/test-login', async (req, res) => {
  try {
    // Find or create test admin
    let user = await User.findOne({ email: 'test@admin.com' });
    
    if (!user) {
      user = new User({
        name: 'Test Admin',
        email: 'test@admin.com',
        phone: '1234567890',
        password: 'test123',
        role: 'admin'
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Test login successful'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Dashboard Analytics
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      totalOrders,
      todayOrders,
      monthlyRevenue,
      pendingOrders,
      activeMenuItems
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.countDocuments({ 'status.current': { $in: ['placed', 'confirmed', 'preparing'] } }),
      MenuItem.countDocuments({ isActive: true })
    ]);

    res.json({
      totalUsers,
      totalOrders,
      todayOrders,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      pendingOrders,
      activeMenuItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Management
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Order Management
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderType } = req.query;
    const query = {};
    
    if (status) query['status.current'] = status;
    if (orderType) query.orderType = orderType;

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.menuItem', 'name price')
      .populate('delivery.partner', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status.current = status;
    order.status.history.push({
      status,
      note,
      timestamp: new Date()
    });

    await order.save();
    
    // Emit real-time update
    req.io.to(`order_${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status,
      timestamp: new Date()
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Menu Management
router.get('/menu', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, isActive, search } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const menuItems = await MenuItem.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ sortOrder: 1, createdAt: -1 });

    const total = await MenuItem.countDocuments(query);

    res.json({
      menuItems,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/menu', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const menuItem = new MenuItem(data);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/menu/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      const existing = await MenuItem.findById(req.params.id);
      if (existing?.image) {
        const oldPath = path.join(__dirname, '..', existing.image);
        fs.unlink(oldPath, () => {});
      }
      updates.image = `/uploads/${req.file.filename}`;
    }
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/menu/:id', adminAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Promo Code Management
router.get('/promos', adminAuth, async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/promos', adminAuth, async (req, res) => {
  try {
    const promo = new PromoCode(req.body);
    await promo.save();
    res.status(201).json(promo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Analytics
router.get('/analytics/revenue', adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics/hourly-orders', adminAuth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $hour: '$createdAt' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Fill all 24 hours with 0 if no data
    const hourMap = Object.fromEntries(data.map(d => [d._id, d.orders]));
    const result = Array.from({ length: 24 }, (_, h) => ({
      hour: h < 12 ? `${h === 0 ? 12 : h}am` : `${h === 12 ? 12 : h - 12}pm`,
      orders: hourMap[h] || 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/analytics/popular-items', adminAuth, async (req, res) => {
  try {
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalOrdered: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          name: '$menuItem.name',
          category: '$menuItem.category',
          totalOrdered: 1,
          revenue: 1
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 }
    ]);

    res.json(popularItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Referral Management
router.get('/referrals', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { referredBy: { $exists: true } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { myReferralCode: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query)
      .select('name phone email myReferralCode referredBy referralCount wallet.balance createdAt')
      .populate('referredBy', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    const totalReferrals = await User.countDocuments({ referredBy: { $exists: true } });
    const topReferrers = await User.find({ referralCount: { $gt: 0 } })
      .select('name phone myReferralCode referralCount')
      .sort({ referralCount: -1 })
      .limit(5);
    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: page, total, totalReferrals, topReferrers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public delivery status — no auth, used by mobile app
router.get('/delivery-status', (req, res) => {
  res.json({ deliveryEnabled });
});

// ─── Delivery Control ───────────────────────────────────────────────────────

// Get delivery control status + all agents + active deliveries
router.get('/delivery-control', adminAuth, async (req, res) => {
  try {
    const agents = await Fleet.find()
      .populate('driver', 'name phone email isActive')
      .populate('currentOrder')
      .sort({ status: 1 });

    const activeDeliveries = await Order.find({
      'status.current': { $in: ['confirmed', 'picked_up', 'out_for_delivery'] },
      orderType: 'delivery',
    })
      .populate('customer', 'name phone')
      .populate('delivery.partner', 'name phone')
      .populate('items.menuItem', 'name')
      .sort({ createdAt: -1 });

    res.json({ deliveryEnabled, agents, activeDeliveries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle global delivery on/off
router.post('/delivery-control/toggle', adminAuth, (req, res) => {
  deliveryEnabled = !deliveryEnabled;
  res.json({ deliveryEnabled });
});

// Force-set delivery enabled state
router.post('/delivery-control/set', adminAuth, (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'enabled must be a boolean' });
  }
  deliveryEnabled = enabled;
  res.json({ deliveryEnabled });
});

// Update a delivery agent's status (available / busy / offline)
router.patch('/delivery-control/agents/:fleetId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const fleet = await Fleet.findByIdAndUpdate(
      req.params.fleetId,
      { status },
      { new: true }
    ).populate('driver', 'name phone');
    if (!fleet) return res.status(404).json({ message: 'Agent not found' });
    res.json(fleet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reassign an active delivery to a different agent
router.post('/delivery-control/reassign', adminAuth, async (req, res) => {
  try {
    const { orderId, newAgentId } = req.body;
    if (!orderId || !newAgentId) {
      return res.status(400).json({ message: 'orderId and newAgentId are required' });
    }

    const [order, newFleet] = await Promise.all([
      Order.findById(orderId),
      Fleet.findOne({ driver: newAgentId }).populate('driver'),
    ]);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!newFleet) return res.status(404).json({ message: 'Agent fleet record not found' });
    if (newFleet.status === 'busy') {
      return res.status(400).json({ message: 'Agent is already busy with another order' });
    }

    // Free up old agent if any
    if (order.delivery.partner) {
      await Fleet.findOneAndUpdate(
        { driver: order.delivery.partner },
        { status: 'available', currentOrder: null }
      );
    }

    // Assign new agent
    order.delivery.partner = newAgentId;
    order.status.history.push({
      status: order.status.current,
      note: `Reassigned to ${newFleet.driver.name} by admin`,
      timestamp: new Date(),
    });
    newFleet.status = 'busy';
    newFleet.currentOrder = orderId;

    await Promise.all([order.save(), newFleet.save()]);
    await order.populate('customer delivery.partner items.menuItem');

    // Notify new agent via socket
    if (req.io) req.io.to(String(newAgentId)).emit('new-assignment', order);

    res.json({ order, fleet: newFleet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel an active delivery (unassign agent, mark order cancelled)
router.post('/delivery-control/cancel-delivery/:orderId', adminAuth, async (req, res) => {
  try {
    const { reason = 'Cancelled by admin' } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Free up agent
    if (order.delivery.partner) {
      await Fleet.findOneAndUpdate(
        { driver: order.delivery.partner },
        { status: 'available', currentOrder: null }
      );
    }

    order.status.current = 'cancelled';
    order.status.history.push({ status: 'cancelled', note: reason, timestamp: new Date() });
    order.cancellation = { reason, cancelledAt: new Date() };
    await order.save();

    if (req.io) req.io.to(String(order._id)).emit('order-status-update', { orderId: order._id, status: 'cancelled' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Reviews Moderation ─────────────────────────────────────────────────────

router.get('/reviews', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, isVerified, minReport } = req.query;
    const query = {};
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (minReport) query.reportCount = { $gte: Number(minReport) };

    const reviews = await Review.find(query)
      .populate('customer', 'name email')
      .populate('menuItem', 'name')
      .populate('order', 'orderNumber')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(query);
    res.json({ reviews, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/reviews/:id/verify', adminAuth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/reviews/:id/respond', adminAuth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { adminResponse: { message: req.body.message, respondedAt: new Date(), respondedBy: req.user._id } },
      { new: true }
    ).populate('customer', 'name').populate('menuItem', 'name');
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/reviews/:id', adminAuth, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Campaigns Management ────────────────────────────────────────────────────

router.get('/campaigns', adminAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/campaigns', adminAuth, async (req, res) => {
  try {
    const campaign = new Campaign({ ...req.body, createdBy: req.user._id });
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/campaigns/:id', adminAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/campaigns/:id', adminAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Push Notifications Broadcast ───────────────────────────────────────────

router.post('/notifications/broadcast', adminAuth, async (req, res) => {
  try {
    const { title, message, type = 'general', targetRole = 'all' } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'title and message are required' });

    const userQuery = targetRole === 'all' ? {} : { role: targetRole };
    const users = await User.find(userQuery).select('_id');

    const notifications = users.map((u) => ({
      user: u._id,
      title,
      message,
      type,
    }));

    await Notification.insertMany(notifications);
    res.json({ message: `Broadcast sent to ${users.length} users`, count: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/notifications/history', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    // Get distinct broadcast notifications (grouped by title+message+sentAt minute)
    const notifications = await Notification.aggregate([
      {
        $group: {
          _id: { title: '$title', message: '$message', type: '$type' },
          sentAt: { $min: '$sentAt' },
          recipientCount: { $sum: 1 },
          readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
        },
      },
      { $sort: { sentAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) },
    ]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Delivery Partners Management ───────────────────────────────────────────

router.get('/delivery-partners', adminAuth, async (req, res) => {
  try {
    const { search, status } = req.query;
    const userQuery = { role: 'delivery_partner' };
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(userQuery).select('-password').sort({ createdAt: -1 });
    const fleets = await Fleet.find({ driver: { $in: users.map(u => u._id) } });
    const fleetMap = Object.fromEntries(fleets.map(f => [String(f.driver), f]));
    let partners = users.map(u => ({ ...u.toObject(), fleet: fleetMap[String(u._id)] || null }));
    if (status) partners = partners.filter(p => p.fleet?.status === status);
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/delivery-partners', adminAuth, async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType, vehicleNumber, licenseNumber } = req.body;
    if (!name || !phone || !password || !vehicleType || !vehicleNumber || !licenseNumber) {
      return res.status(400).json({ message: 'name, phone, password, vehicleType, vehicleNumber and licenseNumber are required' });
    }
    const existing = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] });
    if (existing) return res.status(409).json({ message: 'User with this phone/email already exists' });
    const user = new User({ name, email, phone, password, role: 'delivery_partner' });
    await user.save();
    const fleet = new Fleet({ driver: user._id, vehicleType, vehicleNumber, licenseNumber });
    await fleet.save();
    const result = user.toObject();
    delete result.password;
    res.status(201).json({ ...result, fleet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/delivery-partners/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'delivery_partner' },
      { isActive },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Delivery partner not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/delivery-partners/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'delivery_partner' });
    if (!user) return res.status(404).json({ message: 'Delivery partner not found' });
    await Fleet.findOneAndDelete({ driver: req.params.id });
    res.json({ message: 'Delivery partner removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Order Refund ────────────────────────────────────────────────────────────

router.post('/orders/:id/refund', adminAuth, async (req, res) => {
  try {
    const { amount, reason = 'Refund by admin' } = req.body;
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.payment.status === 'refunded') {
      return res.status(400).json({ message: 'Order already refunded' });
    }

    const refundAmount = amount || order.pricing.total;
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ message: 'Invalid refund amount' });
    }

    const customer = await User.findById(order.customer._id || order.customer);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    customer.wallet.balance += refundAmount;
    customer.wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: `Refund for order #${order.orderNumber || order._id} — ${reason}`,
    });
    await customer.save();

    order.payment.status = 'refunded';
    order.status.history.push({
      status: order.status.current,
      note: `Refund of ₹${refundAmount} issued — ${reason}`,
      timestamp: new Date(),
    });
    await order.save();

    res.json({ message: `Refund of ₹${refundAmount} credited to wallet`, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin Wallet Management ────────────────────────────────────────────────

router.post('/users/:id/wallet/credit', adminAuth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wallet.balance += Number(amount);
    user.wallet.transactions.push({ type: 'credit', amount: Number(amount), description: description || 'Admin credit' });
    await user.save();

    res.json({ balance: user.wallet.balance, transactions: user.wallet.transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users/:id/wallet/debit', adminAuth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.wallet.balance < amount) return res.status(400).json({ message: 'Insufficient wallet balance' });

    user.wallet.balance -= Number(amount);
    user.wallet.transactions.push({ type: 'debit', amount: Number(amount), description: description || 'Admin debit' });
    await user.save();

    res.json({ balance: user.wallet.balance, transactions: user.wallet.transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Restaurant Timing ──────────────────────────────────────────────────────

// Public — used by mobile app
router.get('/restaurant-status', async (req, res) => {
  try {
    const settings = await RestaurantSettings.findById('main');
    if (!settings) return res.json({ isOpen: true });

    const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const todayName = DAY_NAMES[now.getDay()];
    const today = settings.schedule[todayName];

    // Helper: find next open time within 7 days
    const getNextOpenTime = () => {
      for (let offset = 0; offset <= 7; offset++) {
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        const name = DAY_NAMES[d.getDay()];
        const slot = settings.schedule[name];
        if (!slot || !slot.isOpen) continue;
        const [h, m] = slot.openTime.split(':').map(Number);
        if (offset === 0 && nowMins >= h * 60 + m) continue; // already past today's open
        return slot.openTime;
      }
      return null;
    };

    if (!today || !today.isOpen) {
      return res.json({ isOpen: false, nextOpenTime: getNextOpenTime(), schedule: settings.schedule });
    }

    const [openH, openM] = today.openTime.split(':').map(Number);
    const [closeH, closeM] = today.closeTime.split(':').map(Number);
    const isOpen = nowMins >= openH * 60 + openM && nowMins < closeH * 60 + closeM;

    res.json({
      isOpen,
      openTime: today.openTime,
      closeTime: today.closeTime,
      nextOpenTime: isOpen ? null : getNextOpenTime(),
      schedule: settings.schedule,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin — get full schedule
router.get('/restaurant-settings', adminAuth, async (req, res) => {
  try {
    const settings = await RestaurantSettings.findById('main') || new RestaurantSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin — update schedule
router.put('/restaurant-settings', adminAuth, async (req, res) => {
  try {
    const settings = await RestaurantSettings.findByIdAndUpdate(
      'main',
      { schedule: req.body.schedule },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Export deliveryEnabled getter for use in orders route
router.getDeliveryEnabled = () => deliveryEnabled;

module.exports = router;
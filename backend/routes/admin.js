const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const PromoCode = require('../models/PromoCode');
const { auth } = require('../middleware/auth');

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

router.post('/menu', adminAuth, async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/menu/:id', adminAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
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

module.exports = router;
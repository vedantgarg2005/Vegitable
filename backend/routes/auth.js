const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const messageCentral = require('../services/messageCentral');

const router = express.Router();
const otpStore = new Map(); // stores verificationId keyed by phone
// Register
router.post('/register', async (req, res) => {
  try {
    const { name, password, phone, role } = req.body;

    const user = new User({ name, password, phone, role });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    if (phone === '7909888834') {
      otpStore.set(phone, { verificationId: 'test', timestamp: Date.now() });
      return res.json({ message: 'OTP sent successfully' });
    }

    const result = await messageCentral.sendOTP(phone);
    otpStore.set(phone, { verificationId: result.verificationId, timestamp: Date.now() });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP and Login/Register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    
    const storedOtpData = otpStore.get(phone);
    if (!storedOtpData) return res.status(400).json({ message: 'OTP not sent or expired' });

    if (Date.now() - storedOtpData.timestamp > 5 * 60 * 1000) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }

    const isTestBypass = phone === '7909888834' && otp === '0000';
    if (!isTestBypass) {
      const validation = await messageCentral.validateOTP(storedOtpData.verificationId, otp);
      if (!validation.success) return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(phone);

    // Check if user exists
    let user = await User.findOne({ phone });
    
    if (user) {
      // Existing user - login
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          wallet: user.wallet
        },
        isNewUser: false
      });
    } else {
      // New user - check if registration data provided
      if (!name) {
        return res.json({ 
          message: 'Registration required',
          isNewUser: true,
          phone 
        });
      }

      user = new User({ name, phone, password: 'phone_auth' });
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      
      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          wallet: user.wallet
        },
        isNewUser: true
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete Registration
router.post('/complete-registration', async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ message: 'Phone and name are required' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      // Already exists, just log them in
      const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          phone: existingUser.phone,
          role: existingUser.role,
          wallet: existingUser.wallet
        }
      });
    }

    const user = new User({ name, phone, password: 'phone_auth' });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login (keep for backward compatibility)
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register device token for push notifications
router.post('/device-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });
    await User.findByIdAndUpdate(req.userId, { $addToSet: { deviceTokens: token } });
    res.json({ message: 'Token saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove device token on logout
router.delete('/device-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.userId, { $pull: { deviceTokens: token } });
    res.json({ message: 'Token removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
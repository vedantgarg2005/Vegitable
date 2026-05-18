const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const messageCentral = require('../services/messageCentral');

const router = express.Router();
const otpStore = new Map(); // stores verificationId keyed by phone
const REFERRAL_REWARD = 75;

function generateReferralCode(name) {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}

async function applyReferralReward(newUser, referralCode) {
  if (!referralCode) return;
  const referrer = await User.findOne({ myReferralCode: referralCode.toUpperCase() });
  if (!referrer || referrer._id.equals(newUser._id)) return;
  newUser.referredBy = referrer._id;
  referrer.wallet.balance += REFERRAL_REWARD;
  referrer.wallet.transactions.push({ type: 'credit', amount: REFERRAL_REWARD, description: `Referral bonus - ${newUser.name} joined using your code` });
  referrer.referralCount += 1;
  await referrer.save();
  newUser.wallet.balance += REFERRAL_REWARD;
  newUser.wallet.transactions.push({ type: 'credit', amount: REFERRAL_REWARD, description: `Welcome bonus - referred by ${referrer.name}` });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, phone, role });
    user.myReferralCode = generateReferralCode(name);
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
    const { phone, otp, name, email, referralCode } = req.body;
    
    const storedOtpData = otpStore.get(phone);
    if (!storedOtpData) return res.status(400).json({ message: 'OTP not sent or expired' });

    if (Date.now() - storedOtpData.timestamp > 5 * 60 * 1000) {
      otpStore.delete(phone);
      return res.status(400).json({ message: 'OTP expired' });
    }

    const validation = await messageCentral.validateOTP(storedOtpData.verificationId, otp);
    if (!validation.success) return res.status(400).json({ message: 'Invalid OTP' });

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
          email: user.email,
          phone: user.phone,
          role: user.role,
          wallet: user.wallet
        },
        isNewUser: false
      });
    } else {
      // New user - check if registration data provided
      if (!name || !email) {
        return res.json({ 
          message: 'Registration required',
          isNewUser: true,
          phone 
        });
      }

      user = new User({ name, email, phone, password: 'phone_auth' });
      user.myReferralCode = generateReferralCode(name);
      await applyReferralReward(user, referralCode);
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      
      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
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
    const { phone, name, referralCode } = req.body;

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
    user.myReferralCode = generateReferralCode(name);
    await applyReferralReward(user, referralCode);
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
    const { email, phone, password } = req.body;
    
    const user = await User.findOne(phone ? { phone } : { email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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

// Validate referral code
router.get('/referral/validate/:code', async (req, res) => {
  try {
    const user = await User.findOne({ myReferralCode: req.params.code.toUpperCase() }).select('name myReferralCode');
    if (!user) return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    res.json({ valid: true, referrerName: user.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
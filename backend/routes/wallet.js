const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance and transactions
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Deduct from wallet (used internally during order payment)
router.post('/deduct', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.wallet.balance -= amount;
    user.wallet.transactions.push({
      type: 'debit',
      amount,
      description: description || 'Order payment',
    });

    await user.save();
    res.json(user.wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

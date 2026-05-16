const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all addresses
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('addresses');
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add address
router.post('/', auth, async (req, res) => {
  try {
    const { type, address, landmark, city, pincode, isDefault } = req.body;
    const user = await User.findById(req.userId);
    if (isDefault) user.addresses.forEach(a => (a.isDefault = false));
    user.addresses.push({ type, address, landmark, city, pincode, isDefault: !!isDefault });
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update address
router.put('/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    Object.assign(addr, req.body);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete address
router.delete('/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.addresses.pull(req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

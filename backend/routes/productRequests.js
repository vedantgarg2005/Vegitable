const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');

const ProductRequest = mongoose.models.ProductRequest ||
  mongoose.model('ProductRequest', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'reviewed', 'added'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  }));

// POST /api/product-requests
router.post('/', auth, async (req, res) => {
  try {
    const { productName, description } = req.body;
    if (!productName?.trim()) return res.status(400).json({ message: 'Product name is required' });
    const request = new ProductRequest({ user: req.userId, productName: productName.trim(), description: description?.trim() });
    await request.save();
    res.status(201).json({ message: 'Request submitted successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/product-requests/my — user's own requests
router.get('/my', auth, async (req, res) => {
  try {
    const requests = await ProductRequest.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

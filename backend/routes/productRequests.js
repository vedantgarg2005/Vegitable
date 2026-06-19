const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Simple in-memory store (replace with a Mongoose model if persistence is needed)
const ProductRequest = require('mongoose').model('ProductRequest', new (require('mongoose').Schema)({
  user: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
}));

// POST /api/product-requests  — authenticated user submits a request
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

module.exports = router;

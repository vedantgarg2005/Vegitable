const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;
    
    // Verify the user has a delivered order
    const order = await Order.findOne({
      _id: orderId,
      customer: req.userId,
      'status.current': 'delivered',
    });

    if (!order) {
      return res.status(400).json({ message: 'You can only review delivered orders' });
    }

    const review = new Review({
      customer: req.userId,
      product: menuItemId,
      order: orderId,
      rating,
      comment,
    });

    await review.save();
    await review.populate('customer', 'name');
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get reviews for a product
router.get('/item/:itemId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.itemId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user reviews
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.userId })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update review
router.patch('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.userId
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    Object.assign(review, req.body);
    await review.save();
    
    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      customer: req.userId
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
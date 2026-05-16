const express = require('express');
const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;
    
    // Check if user has ordered this item
    const order = await Order.findOne({
      _id: orderId,
      customer: req.userId,
      'items.menuItem': menuItemId
    });
    
    if (!order) {
      return res.status(400).json({ message: 'You can only review items you have ordered' });
    }
    
    const review = new Review({
      customer: req.userId,
      menuItem: menuItemId,
      order: orderId,
      rating,
      comment
    });
    
    await review.save();
    await review.populate('customer', 'name');
    
    // Update menu item rating
    const reviews = await Review.find({ menuItem: menuItemId });
    const avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
    
    await MenuItem.findByIdAndUpdate(menuItemId, {
      rating: avgRating,
      reviewCount: reviews.length
    });
    
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get reviews for menu item
router.get('/item/:itemId', async (req, res) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.itemId })
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
      .populate('menuItem', 'name image')
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
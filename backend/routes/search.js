const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

router.get('/menu', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 20 } = req.query;

    const query = { isActive: true };
    if (q) query.$text = { $search: q };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ items, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/filters', async (req, res) => {
  try {
    const [categories, priceRange] = await Promise.all([
      Product.distinct('category', { isActive: true }),
      Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
    ]);
    res.json({ categories, priceRange: priceRange[0] || { min: 0, max: 1000 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

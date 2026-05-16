const express = require('express');
const MenuItem = require('../models/MenuItem');
const router = express.Router();

// Search and filter menu items
router.get('/menu', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      dietary, 
      spiceLevel, 
      minPrice, 
      maxPrice, 
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    let query = { isActive: true };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Dietary filter
    if (dietary) {
      query.dietary = { $in: dietary.split(',') };
    }

    // Spice level filter
    if (spiceLevel) {
      query.spiceLevel = spiceLevel;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const items = await MenuItem.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(query);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get filter options
router.get('/filters', async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category', { isActive: true });
    const dietary = await MenuItem.distinct('dietary', { isActive: true });
    const spiceLevels = await MenuItem.distinct('spiceLevel', { isActive: true });
    
    const priceRange = await MenuItem.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);

    res.json({
      categories,
      dietary: dietary.flat(),
      spiceLevels,
      priceRange: priceRange[0] || { min: 0, max: 1000 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
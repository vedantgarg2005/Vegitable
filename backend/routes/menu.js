const express = require('express');
const MenuItem = require('../models/MenuItem');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage, limits: { files: 1 } });

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, search, available } = req.query;
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (available !== undefined) query['availability.isAvailable'] = available === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await MenuItem.find(query).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add menu item (Admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const menuItemData = {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    };
    
    const menuItem = new MenuItem(menuItemData);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update menu item (Admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      // Delete old image
      const existing = await MenuItem.findById(req.params.id);
      if (existing?.image) {
        const oldPath = path.join(__dirname, '..', existing.image);
        fs.unlink(oldPath, () => {});
      }
      updates.image = `/uploads/${req.file.filename}`;
    }
    
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete menu item (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
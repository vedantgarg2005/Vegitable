const express = require('express');
const PromoCode = require('../models/PromoCode');
const router = express.Router();

// Get active promo codes (public)
router.get('/active', async (req, res) => {
  try {
    const promos = await PromoCode.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
    }).select('code discountType discountValue minOrderAmount maxDiscount expiryDate');
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate promo code
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    
    const promo = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!promo) {
      return res.status(400).json({ message: 'Invalid or expired promo code' });
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Promo code usage limit exceeded' });
    }

    if (orderAmount < promo.minOrderAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of ₹${promo.minOrderAmount} required` 
      });
    }

    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (orderAmount * promo.discountValue) / 100;
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else {
      discount = promo.discountValue;
    }

    res.json({
      valid: true,
      discount: Math.round(discount),
      code: promo.code
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply promo code (increment usage count)
router.post('/apply', async (req, res) => {
  try {
    const { code } = req.body;
    
    await PromoCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );

    res.json({ message: 'Promo code applied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
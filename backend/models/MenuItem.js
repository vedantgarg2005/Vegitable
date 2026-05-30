const mongoose = require('mongoose');

// Legacy alias — new code should use Product model directly.
// Kept for backward-compat with existing /menu routes.
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  brand: { type: String, default: 'other' },
  category: {
    type: String,
    required: true,
    enum: ['running', 'football', 'cricket', 'basketball', 'fitness', 'swimming', 'cycling', 'hiking', 'yoga', 'accessories'],
  },
  subcategory: String,
  price: { type: Number, required: true },
  originalPrice: Number,
  images: [String],
  image: { type: String, default: '' },
  sizes: [{ size: String, stock: { type: Number, default: 0 } }],
  colors: [String],
  specifications: {
    weight: String,
    material: String,
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  tags: [String],
  isActive: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', productSchema);
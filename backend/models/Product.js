const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  brand: {
    type: String,
    required: true,
    enum: ['decathlon', 'puma', 'nike', 'adidas', 'reebok', 'under_armour', 'asics', 'new_balance', 'columbia', 'other']
  },
  category: {
    type: String,
    required: true,
    enum: ['running', 'football', 'cricket', 'basketball', 'fitness', 'swimming', 'cycling', 'hiking', 'yoga', 'accessories']
  },
  subcategory: String, // e.g. "shoes", "jersey", "equipment"
  price: { type: Number, required: true },
  originalPrice: Number, // for discounts
  images: [String],
  image: { type: String, default: '' },
  sizes: [{ size: String, stock: { type: Number, default: 0 } }], // S, M, L, XL or 7, 8, 9...
  colors: [String],
  specifications: {
    weight: String,
    material: String,
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'] },
    ageGroup: String,
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String], // e.g. "new_arrival", "bestseller", "sale"
  isActive: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);

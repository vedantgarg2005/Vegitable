const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  brand: {
    type: String,
    required: true,
    enum: ['local', 'organic', 'imported', 'farm_fresh', 'other']
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'leafy', 'exotic', 'herbs', 'organic', 'other']
  },
  subcategory: String, // e.g. "root", "citrus", "berries"
  price: { type: Number },
  originalPrice: Number,
  images: [String],
  image: { type: String, default: '' },
  unit: { type: String, default: 'kg' }, // kg, g, piece, bunch
  sizes: [{ size: String, stock: { type: Number, default: 0 } }],
  variants: [{
    label: { type: String, required: true }, // e.g. "500g", "1kg", "Pack of 6"
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
  }],
  specifications: {
    weight: String,
    origin: String,
    isOrganic: { type: Boolean, default: false },
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String], // e.g. "seasonal", "bestseller", "sale"
  isActive: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);

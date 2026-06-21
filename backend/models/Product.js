const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'leafy', 'exotic', 'herbs', 'organic', 'other']
  },
  description: { type: String, default: '' },
  price: { type: Number },
  marketPrice: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  image: { type: String, default: '' },
  unit: { type: String, default: 'kg' },
  variants: [{
    label: { type: String, required: true },
    price: { type: Number, required: true },
    marketPrice: { type: Number, default: 0 },
  }],
  availability: {
    isAvailable: { type: Boolean, default: true },
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String],
  isActive: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);

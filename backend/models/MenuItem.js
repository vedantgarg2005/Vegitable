const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['sweets', 'snacks', 'main_course', 'beverages', 'desserts', 'combos']
  },
  subcategory: String,
  price: { type: Number, required: true },
  originalPrice: Number, // For discounts
  images: [String],
  image: { type: String, default: '' },
  ingredients: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  allergens: [String],
  dietary: [{ type: String, enum: ['vegetarian', 'vegan', 'jain', 'gluten_free'] }],
  spiceLevel: { type: String, enum: ['mild', 'medium', 'spicy'] },
  preparationTime: { type: Number, required: true }, // in minutes
  availability: {
    isAvailable: { type: Boolean, default: true },
    availableFrom: String, // time format "09:00"
    availableTo: String,   // time format "22:00"
    daysAvailable: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }]
  },
  variants: [{
    name: String, // e.g., "Small", "Medium", "Large"
    price: Number,
    description: String
  }],
  addOns: [{
    name: String,
    price: Number,
    category: String
  }],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String], // e.g., "popular", "chef_special", "new"
  isActive: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

menuItemSchema.index({ category: 1, isActive: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
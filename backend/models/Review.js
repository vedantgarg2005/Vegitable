const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [String],
  categories: {
    food: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    packaging: { type: Number, min: 1, max: 5 }
  },
  deliveryRating: { type: Number, min: 1, max: 5 },
  serviceRating: { type: Number, min: 1, max: 5 },
  isVerified: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  adminResponse: {
    message: String,
    respondedAt: Date,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });

reviewSchema.index({ menuItem: 1, rating: -1 });
reviewSchema.index({ restaurant: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
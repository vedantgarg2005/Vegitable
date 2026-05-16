const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['discount', 'bogo', 'free_delivery', 'cashback'], 
    required: true 
  },
  description: String,
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    maxAmount: Number,
    minOrderValue: Number
  },
  targetAudience: {
    userType: { type: String, enum: ['all', 'new', 'returning', 'vip'] },
    location: [String],
    ageGroup: String
  },
  validity: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: Number,
    usageCount: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  referralCode: { type: String },
  myReferralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralRewardClaimed: { type: Boolean, default: false },
  referralCount: { type: Number, default: 0 },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'delivery_partner', 'store_staff'], 
    default: 'customer' 
  },
  avatar: { type: String },
  addresses: [{
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    address: String,
    landmark: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isDefault: { type: Boolean, default: false }
  }],
  preferences: {
    sports: [{ type: String }],
    brands: [{ type: String }],
    sizes: {
      top: String,
      bottom: String,
      shoes: String,
    }
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{
      type: { type: String, enum: ['credit', 'debit'], required: true },
      amount: { type: Number, required: true },
      description: { type: String },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  loyaltyPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  deviceTokens: [String] // For push notifications
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
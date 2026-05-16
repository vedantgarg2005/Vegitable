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
    enum: ['customer', 'admin', 'delivery_partner', 'restaurant_staff'], 
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
    dietary: [{ type: String, enum: ['vegetarian', 'vegan', 'jain', 'gluten_free'] }],
    spiceLevel: { type: String, enum: ['mild', 'medium', 'spicy'], default: 'medium' }
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
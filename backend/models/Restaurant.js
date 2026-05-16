const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: String, required: true },
  address: {
    street: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  contact: {
    phone: String,
    email: String,
    manager: String
  },
  operatingHours: {
    open: String,
    close: String,
    isOpen24x7: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  deliveryRadius: { type: Number, default: 5 }, // in km
  averageDeliveryTime: { type: Number, default: 30 }, // in minutes
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

restaurantSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
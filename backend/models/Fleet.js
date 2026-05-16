const mongoose = require('mongoose');

const fleetSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleType: { 
    type: String, 
    enum: ['bike', 'scooter', 'car', 'bicycle'], 
    required: true 
  },
  vehicleNumber: { type: String, required: true, unique: true },
  licenseNumber: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: { type: Date, default: Date.now }
  },
  status: { 
    type: String, 
    enum: ['available', 'busy', 'offline'], 
    default: 'offline' 
  },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  deliveryStats: {
    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  documents: {
    license: String,
    vehicleRC: String,
    insurance: String,
    photo: String
  },
  workingHours: {
    start: String,
    end: String,
    workingDays: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Fleet', fleetSchema);
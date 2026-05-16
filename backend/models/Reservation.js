const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1, max: 20 },
  tableNumber: Number,
  specialRequests: String,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'], 
    default: 'pending' 
  },
  contactPhone: { type: String, required: true },
  occasion: String,
  preOrder: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    quantity: Number
  }],
  estimatedAmount: Number
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
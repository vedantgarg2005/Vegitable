const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderType: { 
    type: String, 
    enum: ['delivery', 'takeaway', 'dine_in'], 
    required: true 
  },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true },
    variant: String,
    addOns: [{
      name: String,
      price: Number
    }],
    specialInstructions: String,
    price: Number // Price at time of order
  }],
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  payment: {
    method: { 
      type: String, 
      enum: ['cash', 'card', 'wallet', 'upi', 'net_banking'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'], 
      default: 'pending' 
    },
    transactionId: String,
    paidAt: Date
  },
  delivery: {
    address: {
      street: String,
      landmark: String,
      city: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estimatedTime: Date,
    actualTime: Date,
    instructions: String
  },
  dineIn: {
    tableNumber: String,
    guestCount: Number,
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }
  },
  status: {
    current: { 
      type: String, 
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed'
    },
    history: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String
    }]
  },
  promoCode: {
    code: String,
    discount: Number
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  cancellation: {
    reason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    refundAmount: Number
  }
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.orderNumber = 'NDS' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'delivery.partner': 1, 'status.current': 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);
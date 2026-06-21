const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup', 'store_pickup'],
    required: true
  },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String },
    image: { type: String },
    quantity: { type: Number, required: true },
    price: Number,
    specialInstructions: String,
    addOns: [{ name: String, price: Number }]
  }],
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'wallet', 'upi', 'net_banking', 'cashfree', 'wallet+cash'],
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
      coordinates: { lat: Number, lng: Number }
    },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estimatedTime: Date,
    actualTime: Date,
    instructions: String
  },
  status: {
    current: {
      type: String,
      enum: ['placed', 'confirmed', 'processing', 'packed', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed'
    },
    history: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String
    }]
  },
  promoCode: { code: String, discount: Number },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  cancellation: {
    reason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    refundAmount: Number
  }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.orderNumber = 'VGT' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ 'delivery.partner': 1, 'status.current': 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);

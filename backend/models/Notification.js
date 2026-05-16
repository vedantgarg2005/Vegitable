const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['order_update', 'promotion', 'general', 'delivery'], 
    required: true 
  },
  data: mongoose.Schema.Types.Mixed, // Additional data for deep linking
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
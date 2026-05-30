const mongoose = require('mongoose');

const daySchema = {
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '22:00' },
};

const storeSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'main' },
  deliveryEnabled: { type: Boolean, default: true },
  schedule: {
    monday:    daySchema,
    tuesday:   daySchema,
    wednesday: daySchema,
    thursday:  daySchema,
    friday:    daySchema,
    saturday:  daySchema,
    sunday:    { ...daySchema, isOpen: { type: Boolean, default: false } },
  },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);

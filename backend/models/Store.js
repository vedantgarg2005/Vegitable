const mongoose = require('mongoose');

const daySchema = {
  isOpen:    { type: Boolean, default: true },
  openTime:  { type: String,  default: '09:00' },
  closeTime: { type: String,  default: '21:00' },
};

const storeSchema = new mongoose.Schema({
  name:    { type: String, required: true },       // e.g. "SportZone – Connaught Place"
  address: { type: String, required: true },
  area:    { type: String, required: true },        // e.g. "Connaught Place", "Sector 18"
  city:    { type: String, required: true, default: 'Delhi' },
  pincode: { type: String },
  phone:   { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  deliveryEnabled:  { type: Boolean, default: true },
  deliveryRadiusKm: { type: Number,  default: 15 },
  storePickupEnabled: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  brands: [{ type: String }], // brands stocked at this store
  schedule: {
    monday:    daySchema,
    tuesday:   daySchema,
    wednesday: daySchema,
    thursday:  daySchema,
    friday:    daySchema,
    saturday:  daySchema,
    sunday:    { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: '10:00' }, closeTime: { type: String, default: '20:00' } },
  },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);

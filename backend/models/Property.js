const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Thông tin cố định
  name: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  description: { type: String, required: true },
  contactPhone: { type: String, required: true },
  acceptableVehicles: [String],
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  closeTime: String,
  rating: { type: Number, default: 0 },
  
  // Thông tin có thể thay đổi
  facilities: {
    inventory: [String],
    utilityCosts: [{
      name: String,
      cost: Number
    }],
    hasAirCon: Boolean,
    hasMajorAppliances: Boolean,
    numBedrooms: Number,
    bathroom: {
      hasShower: Boolean,
      hasBathtub: Boolean,
      hasPrivateToilet: Boolean
    },
    allowsPets: Boolean,
    deposit: {
      required: Boolean,
      amount: Number
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  images: [String],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  monthlyRent: {
    type: Number,
    required: true
  },
  minStayMonths: {
    type: Number,
    default: 0
  },
  deposit: {
    amount: {
      type: Number,
      default: 0
    },
    months: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Thêm index cho tìm kiếm địa lý
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema); 
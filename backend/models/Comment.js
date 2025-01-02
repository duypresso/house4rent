const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  replies: [{
    user: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
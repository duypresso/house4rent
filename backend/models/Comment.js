const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  reply: {
    content: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema); 
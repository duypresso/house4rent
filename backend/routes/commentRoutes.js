const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

router.post('/:propertyId', protect, commentController.createComment);
router.post('/:commentId/reply', protect, commentController.replyToComment);

module.exports = router; 
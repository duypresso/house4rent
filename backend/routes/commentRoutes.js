const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const commentController = require('../controllers/commentController');
const Comment = require('../models/Comment');
const Property = require('../models/Property');
const User = require('../models/User');

router.post('/:propertyId', protect, async (req, res) => {
  const { propertyId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const user = await User.findById(userId);
    const comment = new Comment({
      user: user.name,
      userId: user._id,
      text,
      createdAt: new Date(),
    });

    property.comments.push(comment);
    await property.save();
    await comment.save();

    // Send email to the property owner
    const owner = await User.findById(property.owner);
    if (owner) {
      const fetch = (await import('node-fetch')).default;
      await fetch(`${process.env.FRONTEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: owner.email,
          subject: 'New Comment on Your Property',
          text: `You have a new comment on your property: ${comment.text}`
        }),
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
});

router.post('/:commentId/reply', protect, commentController.replyToComment);

router.post('/:propertyId/comments/:commentId/replies', protect, async (req, res) => {
  const { propertyId, commentId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const user = await User.findById(userId);
    const reply = {
      user: user.name,
      userEmail: user.email,
      text,
      createdAt: new Date(),
    };

    comment.replies.push(reply);
    await comment.save();

    // Send email to the original commenter
    const commenter = await User.findById(comment.userId);
    if (commenter) {
      const fetch = (await import('node-fetch')).default;
      await fetch(`${process.env.FRONTEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: commenter.email,
          subject: 'New Reply to Your Comment',
          text: `You have a new reply to your comment: ${reply.text}`
        }),
      });
    }

    // Send email to the user who posted the reply
    await fetch(`${process.env.FRONTEND_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        subject: 'Your Reply has been posted',
        text: `Your reply to the comment has been posted: ${reply.text}`
      }),
    });

    // If the owner replies, send an email to the original commenter
    if (userId === property.owner.toString() && commenter) {
      await fetch(`${process.env.FRONTEND_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: commenter.email,
          subject: 'New Reply from Property Owner',
          text: `The property owner has replied to your comment: ${reply.text}`
        }),
      });
    }

    res.status(201).json({ success: true, reply });
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ success: false, message: 'Failed to post reply' });
  }
});

module.exports = router;
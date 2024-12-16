const Comment = require('../models/Comment');
const { sendEmail } = require('../utils/email');

exports.createComment = async (req, res) => {
  try {
    const comment = new Comment({
      property: req.params.propertyId,
      sender: req.user._id,
      content: req.body.content
    });
    
    await comment.save();
    
    // Gửi email cho chủ nhà
    const property = await Property.findById(req.params.propertyId)
      .populate('owner');
      
    await sendEmail({
      to: property.owner.email,
      subject: 'New Comment on Your Property',
      text: `You have a new comment from ${req.user.name}`
    });
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    comment.reply = {
      content: req.body.content,
      createdAt: new Date()
    };
    
    await comment.save();
    
    // Gửi email cho sinh viên
    const student = await User.findById(comment.sender);
    await sendEmail({
      to: student.email,
      subject: 'New Reply to Your Comment',
      text: `The owner has replied to your comment`
    });
    
    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 
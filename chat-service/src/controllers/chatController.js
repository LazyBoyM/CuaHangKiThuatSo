const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Get user conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get messages for a conversation or by receiverId
// @route   GET /api/chat/messages/:receiverId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const receiverId = req.params.receiverId;

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] }
    });

    if (!conversation) {
      return res.json([]);
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 });
      
    // Mark messages as read
    await Message.updateMany(
      { conversationId: conversation._id, sender: receiverId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

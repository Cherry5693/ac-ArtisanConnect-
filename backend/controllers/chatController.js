const { Conversation, Message } = require('../models/model');

exports.createOrGetConversation = async (req, res) => {
  try {
    const { artisanId, productId } = req.params;
    const userId = req.user.id; // Buyer or Artisan ID

    // Determine participant models based on roles
    let participant1Model, participant2Model;
    if (req.user.role === 'buyer') {
      participant1Model = 'BuyerUser';
      participant2Model = 'ArtisanUser';
    } else if (req.user.role === 'artisan') {
      participant1Model = 'ArtisanUser';
      participant2Model = 'BuyerUser';
    } else {
      return res.status(400).json({ msg: 'Invalid user role for chat.' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, artisanId] },
      participantModel: { $all: [participant1Model, participant2Model] }
    });

    if (!conversation) {
      // Create new conversation if not found
      conversation = new Conversation({
        participants: [userId, artisanId],
        participantModel: [participant1Model, participant2Model]
      });
      await conversation.save();
    }

    res.status(200).json({ conversationId: conversation._id });
  } catch (err) {
    console.error('Error in createOrGetConversation:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    const senderModel = req.user.role === 'buyer' ? 'BuyerUser' : 'ArtisanUser';

    if (!conversationId || !content) {
      return res.status(400).json({ msg: 'Conversation ID and message content are required.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    // Debug: log participant membership for troubleshooting
    console.log('sendMessage: req.user.id =', senderId);
    console.log('sendMessage: conversation.participants =', conversation.participants.map(p => p.toString()));
    // Ensure sender is a participant in the conversation
    if (!conversation.participants.some(p => p.toString() === senderId)) {
      console.log('sendMessage: Forbidden - participant check failed', { senderId, participants: conversation.participants.map(p => p.toString()) });
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      senderModel: senderModel,
      content: content,
    });
    await message.save();

    // Update lastMessage in conversation
    conversation.lastMessage = message._id;

    // Update lastReadMessage for sender and recipient
    if (senderModel === 'BuyerUser') {
      conversation.lastReadBuyerMessage = message._id;
      conversation.lastReadArtisanMessage = undefined; // Mark as unread for artisan
    } else if (senderModel === 'ArtisanUser') {
      conversation.lastReadArtisanMessage = message._id;
      conversation.lastReadBuyerMessage = undefined; // Mark as unread for buyer
    }
    await conversation.save();

    res.status(201).json(message);
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userModel = userRole === 'buyer' ? 'BuyerUser' : 'ArtisanUser';

    let conversations = await Conversation.find({
      participants: userId,
    })
    .populate({
      path: 'participants',
      select: 'name email role',
    })
    .populate('lastMessage')
    .populate('lastReadBuyerMessage')
    .populate('lastReadArtisanMessage')
    .sort({ updatedAt: -1 });

    // Filter conversations to ensure strict privacy (one buyer, one artisan)
    conversations = conversations.filter(conv => {
      // Ensure exactly two participants
      if (conv.participants.length !== 2) {
        return false;
      }

      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);

      // Ensure the other participant exists and has the opposite role
      if (!otherParticipant) {
        return false;
      }

      if (userRole === 'buyer' && otherParticipant.role !== 'artisan') {
        return false;
      }
      if (userRole === 'artisan' && otherParticipant.role !== 'buyer') {
        return false;
      }

      return true;
    });

    const conversationsWithUnread = conversations.map(conv => {
      let unreadCount = 0;
      let lastReadMessageId = null;

      if (userRole === 'buyer') {
        lastReadMessageId = conv.lastReadBuyerMessage ? conv.lastReadBuyerMessage._id.toString() : null;
      } else if (userRole === 'artisan') {
        lastReadMessageId = conv.lastReadArtisanMessage ? conv.lastReadArtisanMessage._id.toString() : null;
      }

      // If there's a last message and it's different from the last read message, it's unread
      if (conv.lastMessage && conv.lastMessage._id.toString() !== lastReadMessageId) {
        unreadCount = 1; // Simple unread count for now (1 if last message is unread, 0 otherwise)
      }

      return { ...conv.toObject(), unreadCount };
    });

    // The previous filter `conv => conv.participants.some(p => p !== null)` is now redundant
    // as the above filter ensures valid participants.
    res.status(200).json(conversationsWithUnread);
  } catch (err) {
    console.error('Error in getConversations:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    // Debug: log participant membership for troubleshooting
    console.log('markConversationAsRead: req.user.id =', userId);
    console.log('markConversationAsRead: conversation.participants =', conversation.participants.map(p => p.toString()));
    // Ensure the user is a participant in the conversation
    if (!conversation.participants.some(p => p.toString() === userId)) {
      console.log('markConversationAsRead: Forbidden - participant check failed', { userId, participants: conversation.participants.map(p => p.toString()) });
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    // Find the last message in the conversation
    const lastMessage = await Message.findOne({ conversation: conversationId }).sort({ createdAt: -1 });

    if (lastMessage) {
      if (userRole === 'buyer') {
        conversation.lastReadBuyerMessage = lastMessage._id;
      } else if (userRole === 'artisan') {
        conversation.lastReadArtisanMessage = lastMessage._id;
      }
      await conversation.save();
    }

    res.status(200).json({ msg: 'Conversation marked as read.' });
  } catch (err) {
    console.error('Error marking conversation as read:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let unreadCount = 0;

    const conversations = await Conversation.find({
      participants: userId,
    })
    .populate('lastMessage')
    .populate('lastReadBuyerMessage')
    .populate('lastReadArtisanMessage');

    conversations.forEach(conv => {
      if (conv.lastMessage) {
        if (userRole === 'buyer') {
          if (!conv.lastReadBuyerMessage || conv.lastReadBuyerMessage.toString() !== conv.lastMessage._id.toString()) {
            unreadCount++;
          }
        } else if (userRole === 'artisan') {
          if (!conv.lastReadArtisanMessage || conv.lastReadArtisanMessage.toString() !== conv.lastMessage._id.toString()) {
            unreadCount++;
          }
        }
      }
    });

    res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('Error getting unread message count:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'participants',
        select: 'name email role',
      });

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found.' });
    }

    // Debug: log participant membership for troubleshooting (populated participants)
    console.log('getConversationDetails: req.user.id =', userId);
    console.log('getConversationDetails: conversation.participants =', conversation.participants.map(p => p._id ? p._id.toString() : p.toString()));
    // Ensure the user is a participant in the conversation
    if (!conversation.participants.some(p => p._id.toString() === userId)) {
      console.log('getConversationDetails: Forbidden - participant check failed', { userId, participants: conversation.participants.map(p => p._id ? p._id.toString() : p.toString()) });
      return res.status(403).json({ msg: 'You are not a participant in this conversation.' });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error getting conversation details:', err);
    res.status(500).json({ msg: err.message });
  }
};
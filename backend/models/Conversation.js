const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantModel',
    required: true
  }],
  participantModel: [{
    type: String,
    required: true,
    enum: ['BuyerUser', 'ArtisanUser']
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastReadBuyerMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastReadArtisanMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);

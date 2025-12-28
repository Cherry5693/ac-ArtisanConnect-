const mongoose = require('mongoose');
const BuyerUser = require('./BuyerUser');
const ArtisanUser = require('./ArtisanUser');

// NEW: Schema for individual reviews
const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerUser', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

// UPDATED: ProductSchema now includes reviews and an average rating
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  pricePerKg: { type: Number, required: true },
  imageUrl: { type: String }, // Changed from 'image' to 'imageUrl'
  category: { type: String, required: true },
  unit: { type: String, default: 'kg' },
  minOrderQty: { type: Number, required: true },
  availableQty: { type: Number, default: 0 },
  isPrepped: { type: Boolean, default: false },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'ArtisanUser', required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  reviews: [ReviewSchema], // NEW
  averageRating: { type: Number, default: 0 }, // NEW
  shipping: { // NEW: Shipping information
    zones: [{ type: String }], // e.g., ['US', 'CA', 'MX'] or ['International']
    cost: { type: Number, default: 0 }
  }
}, { timestamps: true });

const DirectOrderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }, // Quantity for direct order
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerUser', required: true }, // Buyer of the order
  status: { type: String, enum: ['open', 'approved', 'processing', 'completed', 'delivered', 'cancelled', 'rejected'], default: 'open' },
  deliveryDate: { type: Date },
  artisanLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  artisanApproved: { type: Boolean, default: false },
  cancellationMessage: { type: String },
}, { timestamps: true });

const Conversation = require('./Conversation');
const Message = require('./Message');

module.exports = {
  BuyerUser,
  ArtisanUser,
  Product: mongoose.model('Product', ProductSchema),
  DirectOrder: mongoose.model('DirectOrder', DirectOrderSchema),
  Conversation,
  Message,
};
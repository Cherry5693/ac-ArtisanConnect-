const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  coords: {
    lat: { type: Number },
    lng: { type: Number },
  },
});

const ArtisanUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  artisanName: { type: String, required: true },
  story: { type: String },
  address: AddressSchema,
  role: { type: String, default: 'artisan' },
  revenue: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ArtisanUser', ArtisanUserSchema);
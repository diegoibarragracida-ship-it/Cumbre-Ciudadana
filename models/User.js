const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, index: true, sparse: true },
  facebookId: { type: String, index: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  photo: { type: String, default: '' },
  provider: { type: String, enum: ['google', 'facebook'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

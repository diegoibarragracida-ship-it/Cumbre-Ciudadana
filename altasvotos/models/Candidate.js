const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  photoUrl: { type: String, default: '/img/default-avatar.svg' },
  bio: { type: String, default: '' },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', candidateSchema);

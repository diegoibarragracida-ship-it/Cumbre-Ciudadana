const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true }, // texto para mostrar, ej. "PAN" o "PAN-PRI-PRD"
  partyType: { type: String, enum: ['partido', 'coalicion'], default: 'partido' },
  partyColors: { type: [String], default: ['#3EE6D0'] }, // 1 color = partido unico, 2+ = coalicion (anillo multicolor)
  photoUrl: { type: String, default: '/img/default-avatar.svg' },
  bio: { type: String, default: '' },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', candidateSchema);

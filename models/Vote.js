const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Un usuario solo puede tener UN voto vigente por distrito
voteSchema.index({ user: 1, district: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);

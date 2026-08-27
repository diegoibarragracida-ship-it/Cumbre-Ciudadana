const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true },        // Ej: "Distrito Local 15 - Orizaba"
  type: { type: String, enum: ['local', 'federal'], required: true },
  number: { type: Number },
  region: { type: String, default: 'Altas Montanas de Veracruz' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('District', districtSchema);

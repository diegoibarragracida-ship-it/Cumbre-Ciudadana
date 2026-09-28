const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true },        // Ej: "Distrito Local 20 - Orizaba"
  type: { type: String, enum: ['local', 'federal'], required: true },
  number: { type: Number },
  state: { type: String, default: 'Veracruz' },
  region: { type: String, default: 'Veracruz' },  // Ej: "Altas Montañas"
  cabecera: { type: String, default: '' },        // Cabecera distrital
  municipalities: { type: [String], default: [] },
  indigenous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

districtSchema.index({ type: 1, number: 1 });

module.exports = mongoose.model('District', districtSchema);

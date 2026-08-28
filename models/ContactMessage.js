const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  subject: { type: String, default: 'Consulta general' },
  message: { type: String, required: true },
  status: { type: String, enum: ['nuevo', 'atendido'], default: 'nuevo' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);

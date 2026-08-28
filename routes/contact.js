const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');

// Datos de contacto de la casa encuestadora. Configurables por variable
// de entorno en Render (no hace falta tocar codigo para actualizarlos).
const ORG = {
  name: 'Cumbre Ciudadana',
  phone: process.env.CONTACT_PHONE || '9214891138',
  whatsapp: (process.env.CONTACT_WHATSAPP || process.env.CONTACT_PHONE || '9214891138').replace(/\D/g, ''),
  email: process.env.CONTACT_EMAIL || ''
};

router.get('/contacto', (req, res) => {
  res.render('contact', {
    title: 'Contacto',
    org: ORG,
    sent: req.query.enviado === '1',
    error: req.query.error
  });
});

router.post('/contacto', async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !message) return res.redirect('/contacto?error=1');

    await ContactMessage.create({ name, phone, email, subject, message });
    res.redirect('/contacto?enviado=1');
  } catch (err) {
    console.error(err);
    res.redirect('/contacto?error=1');
  }
});

module.exports = router;

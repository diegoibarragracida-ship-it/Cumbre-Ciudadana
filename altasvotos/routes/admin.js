const express = require('express');
const router = express.Router();
const { ensureAuth, ensureAdmin } = require('./middleware');
const District = require('../models/District');
const Candidate = require('../models/Candidate');

router.use(ensureAuth, ensureAdmin);

// Panel principal
router.get('/', async (req, res) => {
  const districts = await District.find().sort({ type: 1, number: 1 });
  const candidates = await Candidate.find().populate('district');
  res.render('admin', { title: 'Panel de administracion', districts, candidates });
});

// Crear distrito
router.post('/distrito', async (req, res) => {
  const { name, type, number } = req.body;
  await District.create({ name, type, number: number || null });
  res.redirect('/admin');
});

// Eliminar distrito
router.post('/distrito/:id/eliminar', async (req, res) => {
  await District.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// Crear candidato
router.post('/candidato', async (req, res) => {
  const { name, party, photoUrl, bio, district } = req.body;
  await Candidate.create({ name, party, photoUrl: photoUrl || undefined, bio, district });
  res.redirect('/admin');
});

// Eliminar candidato
router.post('/candidato/:id/eliminar', async (req, res) => {
  await Candidate.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

module.exports = router;

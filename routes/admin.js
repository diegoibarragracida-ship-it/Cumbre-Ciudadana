const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ensureAuth, ensureAdmin } = require('./middleware');
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const PARTIES = require('../config/parties');

// Guardamos la imagen en memoria y la convertimos a base64 para meterla
// directo en Mongo. Esto evita depender del disco de Render, que es
// efimero (se borra en cada redeploy/reinicio).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por foto
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('El archivo debe ser una imagen'));
    cb(null, true);
  }
});

router.use(ensureAuth, ensureAdmin);

// Panel principal
router.get('/', async (req, res) => {
  const districts = await District.find().sort({ type: 1, number: 1 });
  const candidates = await Candidate.find().populate('district');
  res.render('admin', { title: 'Panel de administracion', districts, candidates, parties: PARTIES });
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
router.post('/candidato', upload.single('photo'), async (req, res) => {
  try {
    const { name, bio, district, partyType } = req.body;

    // partyKeys llega como string (un solo partido) o array (coalicion con checkboxes)
    let partyKeys = req.body.partyKeys || [];
    if (!Array.isArray(partyKeys)) partyKeys = [partyKeys];
    partyKeys = partyKeys.filter(Boolean);

    let partyLabel, partyColors;

    if (partyKeys.length && partyKeys[0] !== 'otro') {
      const matched = partyKeys.map(k => PARTIES.find(p => p.key === k)).filter(Boolean);
      partyLabel = matched.map(p => p.name).join(' - ');
      partyColors = matched.map(p => p.color);
    }

    // "Otro" o si no se selecciono nada valido: usar el texto/color manual
    if (!partyLabel) {
      partyLabel = (req.body.partyManual || '').trim() || 'Independiente';
      partyColors = [(req.body.colorManual || '#3EE6D0').trim()];
    }

    // Foto: si subieron archivo, se guarda como base64; si no, se usa la URL escrita
    let photoUrl = (req.body.photoUrl || '').trim() || undefined;
    if (req.file) {
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await Candidate.create({
      name,
      party: partyLabel,
      partyType: partyType === 'coalicion' ? 'coalicion' : 'partido',
      partyColors,
      photoUrl,
      bio,
      district
    });

    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error al crear candidato: ' + err.message);
  }
});

// Eliminar candidato
router.post('/candidato/:id/eliminar', async (req, res) => {
  await Candidate.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

module.exports = router;

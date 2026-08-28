const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ensureAuth, ensureAdmin, asyncHandler, validObjectId } = require('./middleware');
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const ContactMessage = require('../models/ContactMessage');
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

// Resuelve partido/coalicion + colores a partir del body del formulario.
// Se usa tanto para crear como para editar candidatos.
function resolveParty(body) {
  let partyKeys = body.partyKeys || [];
  if (!Array.isArray(partyKeys)) partyKeys = [partyKeys];
  partyKeys = partyKeys.filter(Boolean);

  let partyLabel, partyColors;

  if (partyKeys.length && partyKeys[0] !== 'otro') {
    const matched = partyKeys.map(k => PARTIES.find(p => p.key === k)).filter(Boolean);
    if (matched.length) {
      partyLabel = matched.map(p => p.name).join(' - ');
      partyColors = matched.map(p => p.color);
    }
  }

  // "Otro", nada seleccionado, o clave invalida: usar el texto/color manual
  if (!partyLabel) {
    partyLabel = (body.partyManual || '').trim() || 'Independiente';
    partyColors = [(body.colorManual || '#3EE6D0').trim()];
  }

  return { partyLabel, partyColors };
}

router.use(ensureAuth, ensureAdmin);

// Panel principal
router.get('/', asyncHandler(async (req, res) => {
  const districts = await District.find().sort({ type: 1, number: 1 });
  const candidates = await Candidate.find().populate('district');
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(50);
  res.render('admin', { title: 'Panel de administracion', districts, candidates, parties: PARTIES, messages });
}));

// Crear distrito
router.post('/distrito', asyncHandler(async (req, res) => {
  const { name, type, number } = req.body;
  await District.create({ name, type, number: number || null });
  res.redirect('/admin');
}));

// Eliminar distrito
router.post('/distrito/:id/eliminar', validObjectId(), asyncHandler(async (req, res) => {
  await District.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
}));

// Crear candidato
router.post('/candidato', upload.single('photo'), asyncHandler(async (req, res) => {
  const { name, bio, district, partyType } = req.body;
  const { partyLabel, partyColors } = resolveParty(req.body);

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
}));

// Formulario para editar un candidato existente (corregir partido, color, foto, etc.)
router.get('/candidato/:id/editar', validObjectId(), asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).render('404', { title: 'No encontrado' });
  const districts = await District.find().sort({ type: 1, number: 1 });
  res.render('edit-candidate', { title: 'Editar candidato', candidate, districts, parties: PARTIES });
}));

// Guardar edicion de candidato
router.post('/candidato/:id/editar', validObjectId(), upload.single('photo'), asyncHandler(async (req, res) => {
  const { name, bio, district, partyType } = req.body;
  const { partyLabel, partyColors } = resolveParty(req.body);

  const update = {
    name,
    party: partyLabel,
    partyType: partyType === 'coalicion' ? 'coalicion' : 'partido',
    partyColors,
    bio,
    district
  };

  if (req.file) {
    update.photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  } else if ((req.body.photoUrl || '').trim()) {
    update.photoUrl = req.body.photoUrl.trim();
  }
  // Si no subio archivo ni escribio URL, se conserva la foto que ya tenia.

  await Candidate.findByIdAndUpdate(req.params.id, update);
  res.redirect('/admin');
}));

// Eliminar candidato
router.post('/candidato/:id/eliminar', validObjectId(), asyncHandler(async (req, res) => {
  await Candidate.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
}));

// Marcar mensaje de contacto como atendido
router.post('/mensaje/:id/atender', validObjectId(), asyncHandler(async (req, res) => {
  await ContactMessage.findByIdAndUpdate(req.params.id, { status: 'atendido' });
  res.redirect('/admin');
}));

module.exports = router;

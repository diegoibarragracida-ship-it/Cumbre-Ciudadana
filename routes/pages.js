const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ensureAuth } = require('./middleware');
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const PARTIES = require('../config/parties');

// Igual que en /admin: la foto se guarda en memoria y se convierte a
// base64 para meterla directo en Mongo (el disco de Render es efimero).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('El archivo debe ser una imagen'));
    cb(null, true);
  }
});

// Politica de privacidad (requerida por Google/Facebook OAuth)
router.get('/privacidad', (req, res) => {
  res.render('privacy', { title: 'Política de privacidad' });
});

// Home: lista de distritos agrupados
router.get('/', async (req, res) => {
  const districts = await District.find().sort({ type: 1, number: 1 });
  const local = districts.filter(d => d.type === 'local');
  const federal = districts.filter(d => d.type === 'federal');
  const totalVotes = await Vote.countDocuments();
  const totalCandidates = await Candidate.countDocuments();
  res.render('index', {
    title: 'Inicio', local, federal, error: req.query.error,
    totalVotes, totalCandidates, totalDistricts: districts.length
  });
});

// Detalle de distrito: candidatos + grafica
router.get('/distrito/:id', async (req, res) => {
  const district = await District.findById(req.params.id);
  if (!district) return res.status(404).send('Distrito no encontrado');

  const candidates = await Candidate.find({ district: district._id });

  let myVote = null;
  if (req.isAuthenticated()) {
    const v = await Vote.findOne({ user: req.user._id, district: district._id });
    if (v) myVote = v.candidate.toString();
  }

  res.render('district', { title: district.name, district, candidates, myVote, parties: PARTIES, error: req.query.error });
});

// Un ciudadano agrega su propio candidato porque no lo encontro en la lista
// del distrito. Reglas del negocio:
//  - Requiere estar logueado (ensureAuth).
//  - Solo puede ELEGIR nombre, foto (opcional) y partido (uno de la lista) o
//    marcarlo como independiente. No hay opcion de editar/eliminar aqui:
//    eso queda exclusivo para /admin (ensureAdmin).
//  - Su voto se registra en automatico para el candidato recien creado.
router.post('/distrito/:id/agregar-candidato', ensureAuth, upload.single('photo'), async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) return res.status(404).send('Distrito no encontrado');

    const name = (req.body.name || '').trim();
    if (!name) return res.redirect(`/distrito/${district._id}?error=nombre_requerido`);

    const isIndependent = req.body.partyMode !== 'partido';
    let partyLabel, partyColors;

    if (!isIndependent) {
      const matched = PARTIES.find(p => p.key === req.body.partyKey && p.key !== 'otro');
      if (matched) {
        partyLabel = matched.name;
        partyColors = [matched.color];
      }
    }
    if (!partyLabel) {
      partyLabel = 'Independiente';
      partyColors = ['#9AA5B1'];
    }

    let photoUrl;
    if (req.file) {
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const candidate = await Candidate.create({
      name,
      party: partyLabel,
      partyType: 'partido',
      partyColors,
      photoUrl,
      district: district._id,
      addedByUser: req.user._id,
      isCitizenAdded: true
    });

    // El voto de quien lo agrega cuenta en automatico para su candidato.
    await Vote.findOneAndUpdate(
      { user: req.user._id, district: district._id },
      { user: req.user._id, district: district._id, candidate: candidate._id, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.redirect(`/distrito/${district._id}`);
  } catch (err) {
    console.error(err);
    res.status(400).send('Error al agregar candidato: ' + err.message);
  }
});

// Detalle de candidato: bio + comentarios
router.get('/candidato/:id', async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('district');
  if (!candidate) return res.status(404).send('Candidato no encontrado');

  const comments = await Comment.find({ candidate: candidate._id })
    .populate('user', 'name photo')
    .sort({ createdAt: -1 })
    .limit(100);

  let myVote = null;
  if (req.isAuthenticated()) {
    const v = await Vote.findOne({ user: req.user._id, district: candidate.district._id });
    if (v) myVote = v.candidate.toString();
  }

  res.render('candidate', { title: candidate.name, candidate, comments, myVote, error: req.query.error });
});

// API: resultados en vivo para la grafica (Chart.js)
router.get('/api/distrito/:id/resultados', async (req, res) => {
  const candidates = await Candidate.find({ district: req.params.id });
  const results = await Promise.all(candidates.map(async (c) => {
    const votes = await Vote.countDocuments({ candidate: c._id });
    return { id: c._id, name: c.name, party: c.party, partyColors: c.partyColors, votes };
  }));
  res.json(results);
});

// API: historial de votos del distrito (quien voto por quien)
router.get('/api/distrito/:id/historial', async (req, res) => {
  const votes = await Vote.find({ district: req.params.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'name photo')
    .populate('candidate', 'name party');

  const historial = votes.map(v => ({
    userName: v.user ? v.user.name : 'Usuario',
    userPhoto: v.user ? v.user.photo : '',
    candidateName: v.candidate ? v.candidate.name : 'Candidato eliminado',
    party: v.candidate ? v.candidate.party : '',
    date: v.createdAt
  }));

  res.json(historial);
});

module.exports = router;

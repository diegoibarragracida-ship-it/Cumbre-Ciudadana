const express = require('express');
const router = express.Router();
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');

// Politica de privacidad (requerida por Google/Facebook OAuth)
router.get('/privacidad', (req, res) => {
  res.render('privacy', { title: 'Política de privacidad' });
});

// Home: lista de distritos agrupados
router.get('/', async (req, res) => {
  const districts = await District.find().sort({ type: 1, number: 1 });
  const local = districts.filter(d => d.type === 'local');
  const federal = districts.filter(d => d.type === 'federal');
  res.render('index', { title: 'Inicio', local, federal, error: req.query.error });
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

  res.render('district', { title: district.name, district, candidates, myVote, error: req.query.error });
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

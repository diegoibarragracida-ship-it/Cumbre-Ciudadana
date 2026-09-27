const express = require('express');
const router = express.Router();
const { ensureAuth } = require('./middleware');
const asyncHandler = require('./asyncHandler');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// Registrar (o cambiar) el voto de un usuario en el distrito del candidato
router.post('/:candidateId', ensureAuth, asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.candidateId);
  if (!candidate) return res.status(404).render('404', { title: 'Candidato no encontrado' });

  await Vote.findOneAndUpdate(
    { user: req.user._id, district: candidate.district },
    { user: req.user._id, district: candidate.district, candidate: candidate._id, createdAt: new Date() },
    { upsert: true, new: true }
  );

  res.redirect(`/distrito/${candidate.district}?votado=1`);
}));

module.exports = router;

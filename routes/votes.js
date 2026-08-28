const express = require('express');
const router = express.Router();
const { ensureAuth, asyncHandler, validObjectId } = require('./middleware');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// Registrar (o cambiar) el voto de un usuario en el distrito del candidato
router.post('/:candidateId', validObjectId('candidateId'), ensureAuth, asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.candidateId);
  if (!candidate) return res.status(404).render('404', { title: 'No encontrado' });

  await Vote.findOneAndUpdate(
    { user: req.user._id, district: candidate.district },
    { user: req.user._id, district: candidate.district, candidate: candidate._id, createdAt: new Date() },
    { upsert: true, new: true }
  );

  res.redirect(`/distrito/${candidate.district}`);
}));

module.exports = router;

const express = require('express');
const router = express.Router();
const { ensureAuth } = require('./middleware');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// Registrar (o cambiar) el voto de un usuario en el distrito del candidato
router.post('/:candidateId', ensureAuth, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).send('Candidato no encontrado');

    await Vote.findOneAndUpdate(
      { user: req.user._id, district: candidate.district },
      { user: req.user._id, district: candidate.district, candidate: candidate._id, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.redirect(`/distrito/${candidate.district}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar el voto');
  }
});

module.exports = router;

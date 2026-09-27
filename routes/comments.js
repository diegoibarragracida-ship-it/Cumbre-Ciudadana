const express = require('express');
const router = express.Router();
const { ensureAuth } = require('./middleware');
const asyncHandler = require('./asyncHandler');
const Comment = require('../models/Comment');

// Comentario sobre la encuesta general de un distrito (no sobre un
// candidato en particular). Aparece en la seccion de comentarios de
// /distrito/:id.
router.post('/distrito/:districtId', ensureAuth, asyncHandler(async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.redirect(`/distrito/${req.params.districtId}`);

  await Comment.create({
    user: req.user._id,
    district: req.params.districtId,
    text: text.slice(0, 500)
  });

  res.redirect(`/distrito/${req.params.districtId}#comentarios-encuesta`);
}));

// Comentario sobre un candidato especifico (perfil del candidato).
router.post('/:candidateId', ensureAuth, asyncHandler(async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.redirect(`/candidato/${req.params.candidateId}`);

  await Comment.create({
    user: req.user._id,
    candidate: req.params.candidateId,
    text: text.slice(0, 500)
  });

  res.redirect(`/candidato/${req.params.candidateId}`);
}));

module.exports = router;

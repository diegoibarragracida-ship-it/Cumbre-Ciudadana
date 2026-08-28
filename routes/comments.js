const express = require('express');
const router = express.Router();
const { ensureAuth, asyncHandler, validObjectId } = require('./middleware');
const Comment = require('../models/Comment');

router.post('/:candidateId', validObjectId('candidateId'), ensureAuth, asyncHandler(async (req, res) => {
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

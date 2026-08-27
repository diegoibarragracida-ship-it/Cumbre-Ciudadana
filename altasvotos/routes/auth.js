const express = require('express');
const passport = require('passport');
const router = express.Router();

// --- Google ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/?error=login' }),
  (req, res) => res.redirect('/')
);

// --- Facebook ---
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/?error=login' }),
  (req, res) => res.redirect('/')
);

// --- Logout ---
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;

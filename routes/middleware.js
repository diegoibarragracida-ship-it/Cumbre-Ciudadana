function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/?error=auth_required');
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.email === process.env.ADMIN_EMAIL) {
    return next();
  }
  return res.status(403).send('Acceso restringido al administrador.');
}

module.exports = { ensureAuth, ensureAdmin };

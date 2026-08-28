function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  const back = req.get('Referer') || '/';
  const sep = back.includes('?') ? '&' : '?';
  return res.redirect(`${back}${sep}error=auth_required`);
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.email === process.env.ADMIN_EMAIL) {
    return next();
  }
  return res.status(403).send('Acceso restringido al administrador.');
}

module.exports = { ensureAuth, ensureAdmin };

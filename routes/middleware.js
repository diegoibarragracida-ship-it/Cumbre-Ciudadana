const mongoose = require('mongoose');

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

// Envuelve una ruta async para que cualquier error (incluyendo un
// CastError de Mongoose por un ID invalido) se pase a Express en vez
// de tumbar todo el proceso. Sin esto, un solo link roto o un bot
// probando URLs raras podia derribar el servidor completo.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Middleware para usar en rutas con :id que van a Mongo. Si el ID no
// tiene forma de ObjectId valido, responde 404 de una vez en lugar de
// dejar que Mongoose truene mas adelante con un CastError.
function validObjectId(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(404).render('404', { title: 'No encontrado' });
    }
    next();
  };
}

module.exports = { ensureAuth, ensureAdmin, asyncHandler, validObjectId };

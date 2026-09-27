// Envuelve un route handler async para que cualquier error que truene
// adentro (ej. un ID invalido que revienta el cast de Mongoose, como
// /distrito/l1) se mande a next(err) en vez de quedar como una promesa
// rechazada sin capturar. En versiones recientes de Node, una promesa
// rechazada sin capturar TUMBA TODO EL PROCESO. Con este wrapper, el
// error llega al manejador global de errores en server.js y responde
// con una pagina de error en vez de crashear.
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

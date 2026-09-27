const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Un comentario es O sobre un candidato especifico, O sobre la encuesta
  // general de un distrito (no ambos). Cual de los dos se llena depende
  // de en que formulario se publico (ver routes/comments.js).
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', default: null },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', default: null },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

commentSchema.pre('validate', function (next) {
  if (!this.candidate && !this.district) {
    return next(new Error('El comentario debe pertenecer a un candidato o a un distrito.'));
  }
  next();
});

module.exports = mongoose.model('Comment', commentSchema);

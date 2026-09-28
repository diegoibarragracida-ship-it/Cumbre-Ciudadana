const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ensureAuth } = require('./middleware');
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const PARTIES = require('../config/parties');

// Igual que en /admin: la foto se guarda en memoria y se convierte a
// base64 para meterla directo en Mongo (el disco de Render es efimero).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('El archivo debe ser una imagen'));
    cb(null, true);
  }
});

// Politica de privacidad (requerida por Google/Facebook OAuth)
router.get('/privacidad', (req, res) => {
  res.render('privacy', { title: 'Política de privacidad' });
});

// Resumen estatal: una tarjeta por distrito con total de votos y puntero actual.
async function buildStateSummary() {
  const districts = await District.find().sort({ type: 1, number: 1 }).lean();
  const grouped = await Vote.aggregate([
    { $group: { _id: { d: '$district', c: '$candidate' }, n: { $sum: 1 } } }
  ]);
  const byDistrict = new Map();
  for (const g of grouped) {
    const k = String(g._id.d);
    const e = byDistrict.get(k) || { total: 0, top: null };
    e.total += g.n;
    if (!e.top || g.n > e.top.n) e.top = { c: g._id.c, n: g.n };
    byDistrict.set(k, e);
  }
  const leaderIds = [...byDistrict.values()].filter(e => e.top).map(e => e.top.c);
  const leaders = await Candidate.find({ _id: { $in: leaderIds } }).select('name party partyColors').lean();
  const leaderMap = new Map(leaders.map(c => [String(c._id), c]));

  const cards = districts.map(d => {
    const e = byDistrict.get(String(d._id)) || { total: 0, top: null };
    const lc = e.top ? leaderMap.get(String(e.top.c)) : null;
    return {
      id: String(d._id), name: d.name, type: d.type, number: d.number || 0,
      cabecera: d.cabecera || '', region: d.region || 'Veracruz',
      indigenous: !!d.indigenous, municipalities: (d.municipalities || []).length,
      votes: e.total,
      leader: lc ? { name: lc.name, party: lc.party, color: (lc.partyColors || [])[0] || '#3EE6D0',
                     pct: e.total ? Math.round((e.top.n / e.total) * 100) : 0 } : null
    };
  });
  return {
    cards,
    totals: {
      districts: cards.length,
      federal: cards.filter(c => c.type === 'federal').length,
      local: cards.filter(c => c.type === 'local').length,
      votes: cards.reduce((a, c) => a + c.votes, 0)
    }
  };
}

// Home estatal
router.get('/', async (req, res) => {
  const [summary, totalCandidates] = await Promise.all([buildStateSummary(), Candidate.countDocuments()]);
  const regions = [...new Set(summary.cards.map(c => c.region))].sort();
  res.render('index', {
    title: 'Veracruz', error: req.query.error,
    summary, regions, totalCandidates,
    extraCss: ['/css/landing.css'], extraJs: ['/js/chart.js', '/js/landing.js']
  });
});

// API: resumen en vivo para contadores y tarjetas de la home
router.get('/api/estado/resumen', async (req, res) => {
  try { res.json(await buildStateSummary()); }
  catch (err) { console.error(err); res.status(500).json({ error: 'No se pudo generar el resumen' }); }
});

// Detalle de distrito: candidatos + grafica
// NOTA: ya no se valida el formato del ID con mongoose.isValidObjectId
// antes de buscar. Esa validacion estaba rechazando IDs de distrito
// reales (como "f1", que no tiene el formato largo de Mongo) que si
// existen en la base de datos. En su lugar, el try/catch de abajo
// atrapa cualquier error de busqueda (ID realmente invalido, basura,
// etc.) y muestra "no encontrado" sin romper nada.
router.get('/distrito/:id', async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) return res.status(404).send('Distrito no encontrado');

    const candidates = await Candidate.find({ district: district._id });

    let myVote = null;
    if (req.isAuthenticated()) {
      const v = await Vote.findOne({ user: req.user._id, district: district._id });
      if (v) myVote = v.candidate.toString();
    }

    res.render('district', { title: district.name, district, candidates, myVote, parties: PARTIES, error: req.query.error });
  } catch (err) {
    console.error(err);
    res.status(404).send('Distrito no encontrado');
  }
});

// Un ciudadano agrega su propio candidato porque no lo encontro en la lista
// del distrito. Reglas del negocio:
//  - Requiere estar logueado (ensureAuth).
//  - Solo puede ELEGIR nombre, foto (opcional) y partido (uno de la lista) o
//    marcarlo como independiente. No hay opcion de editar/eliminar aqui:
//    eso queda exclusivo para /admin (ensureAdmin).
//  - Su voto se registra en automatico para el candidato recien creado.
router.post('/distrito/:id/agregar-candidato', ensureAuth, upload.single('photo'), async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) return res.status(404).send('Distrito no encontrado');

    const name = (req.body.name || '').trim();
    if (!name) return res.redirect(`/distrito/${district._id}?error=nombre_requerido`);

    const isIndependent = req.body.partyMode !== 'partido';
    let partyLabel, partyColors;

    if (!isIndependent) {
      const matched = PARTIES.find(p => p.key === req.body.partyKey && p.key !== 'otro');
      if (matched) {
        partyLabel = matched.name;
        partyColors = [matched.color];
      }
    }
    if (!partyLabel) {
      partyLabel = 'Independiente';
      partyColors = ['#9AA5B1'];
    }

    let photoUrl;
    if (req.file) {
      photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const candidate = await Candidate.create({
      name,
      party: partyLabel,
      partyType: 'partido',
      partyColors,
      photoUrl,
      district: district._id,
      addedByUser: req.user._id,
      isCitizenAdded: true
    });

    // El voto de quien lo agrega cuenta en automatico para su candidato.
    await Vote.findOneAndUpdate(
      { user: req.user._id, district: district._id },
      { user: req.user._id, district: district._id, candidate: candidate._id, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.redirect(`/distrito/${district._id}`);
  } catch (err) {
    console.error(err);
    res.status(400).send('Error al agregar candidato: ' + err.message);
  }
});

// Detalle de candidato: bio + comentarios
router.get('/candidato/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('district');
    if (!candidate) return res.status(404).send('Candidato no encontrado');

    const comments = await Comment.find({ candidate: candidate._id })
      .populate('user', 'name photo')
      .sort({ createdAt: -1 })
      .limit(100);

    let myVote = null;
    if (req.isAuthenticated()) {
      const v = await Vote.findOne({ user: req.user._id, district: candidate.district._id });
      if (v) myVote = v.candidate.toString();
    }

    res.render('candidate', { title: candidate.name, candidate, comments, myVote, error: req.query.error });
  } catch (err) {
    console.error(err);
    res.status(404).send('Candidato no encontrado');
  }
});

// API: resultados en vivo para la grafica (Chart.js)
router.get('/api/distrito/:id/resultados', async (req, res) => {
  try {
    const candidates = await Candidate.find({ district: req.params.id });
    const results = await Promise.all(candidates.map(async (c) => {
      const votes = await Vote.countDocuments({ candidate: c._id });
      return { id: c._id, name: c.name, party: c.party, partyColors: c.partyColors, votes };
    }));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'ID de distrito invalido' });
  }
});

// API: historial de votos del distrito (quien voto por quien)
router.get('/api/distrito/:id/historial', async (req, res) => {
  try {
    const votes = await Vote.find({ district: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name photo')
      .populate('candidate', 'name party');

    const historial = votes.map(v => ({
      userName: v.user ? v.user.name : 'Usuario',
      userPhoto: v.user ? v.user.photo : '',
      candidateName: v.candidate ? v.candidate.name : 'Candidato eliminado',
      party: v.candidate ? v.candidate.party : '',
      date: v.createdAt
    }));

    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'ID de distrito invalido' });
  }
});

module.exports = router;

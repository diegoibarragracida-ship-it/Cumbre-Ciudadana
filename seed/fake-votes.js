/**
 * Genera votos DE PRUEBA repartidos al azar entre distritos que ya
 * tengan candidatos (o solo en UN distrito especifico si se lo pides).
 * Cada voto viene de un usuario ficticio distinto (no reutiliza
 * usuarios reales ni pisa sus votos), para respetar la regla de un
 * voto por persona por distrito.
 *
 * Sirve para probar como se ve la grafica de resultados, el pastel y
 * el LED con actividad real, antes de que lleguen votantes de verdad.
 *
 * NO borra nada existente, solo agrega votos nuevos encima.
 *
 * Uso:
 *   npm run seed:votes -- 100
 *   (reparte 100 votos entre TODOS los distritos con candidatos)
 *
 *   npm run seed:votes -- 100 --district=6a90da299a5cffdd0d19b652
 *   (reparte 100 votos SOLO en ese distrito, entre sus candidatos)
 *
 * Para quitar despues todos los votos y usuarios de prueba que genere
 * este script (y dejar limpio para votantes reales):
 *   npm run seed:votes -- --clean
 */
require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');

const FAKE_PREFIX = 'fake-voter-';
const CLEAN = process.argv.includes('--clean');
const totalArg = process.argv.find(a => /^\d+$/.test(a));
const TOTAL_VOTES = totalArg ? parseInt(totalArg, 10) : 100;
const districtArg = process.argv.find(a => a.startsWith('--district='));
const DISTRICT_ID = districtArg ? districtArg.split('=')[1] : null;

// Nombres realistas para los votantes de prueba, para que el historial
// se vea con nombres normales en vez de "Votante de prueba N".
const NOMBRES = [
  'María', 'José', 'Guadalupe', 'Juan', 'Ana', 'Luis', 'Rosa', 'Carlos',
  'Verónica', 'Miguel', 'Alejandra', 'Francisco', 'Laura', 'Jorge', 'Karla',
  'Antonio', 'Fernanda', 'Ricardo', 'Daniela', 'Manuel', 'Patricia', 'Jesús',
  'Claudia', 'Roberto', 'Gabriela', 'Alejandro', 'Mónica', 'Eduardo', 'Sofía',
  'Raúl', 'Leticia', 'Sergio', 'Adriana', 'Pedro', 'Elena', 'Arturo', 'Cecilia',
  'Emilio', 'Itzel', 'Hugo', 'Yesenia', 'Rubén', 'Diana', 'Salvador', 'Paola',
  'Ignacio', 'Beatriz', 'Israel', 'Xóchitl', 'Álvaro', 'Nayeli'
];
const APELLIDOS = [
  'Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Díaz', 'Reyes', 'Morales', 'Jiménez',
  'Torres', 'Vázquez', 'Ortiz', 'Ruiz', 'Rojas', 'Mendoza', 'Aguilar',
  'Domínguez', 'Castillo', 'Herrera', 'Vargas', 'Romero', 'Medina', 'Guzmán',
  'Cortés', 'Salazar', 'Ríos', 'Contreras', 'Delgado', 'Luna', 'Ramos'
];

function randomName() {
  const n = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
  const a1 = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
  const a2 = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
  return `${n} ${a1} ${a2}`;
}

async function clean() {
  const fakeUsers = await User.find({ googleId: { $regex: `^${FAKE_PREFIX}` } });
  const fakeIds = fakeUsers.map(u => u._id);
  const votesDeleted = await Vote.deleteMany({ user: { $in: fakeIds } });
  const usersDeleted = await User.deleteMany({ _id: { $in: fakeIds } });
  console.log(`Eliminados ${votesDeleted.deletedCount} votos de prueba y ${usersDeleted.deletedCount} usuarios de prueba.`);
}

// Distribucion "natural": a cada candidato se le da un peso al azar
// (no parejo), y los votos se reparten proporcional a esos pesos.
function weightedDistribution(n, count) {
  const weights = Array.from({ length: count }, () => Math.random() ** 2 + 0.05);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (w / totalWeight) * n);
  const base = raw.map(Math.floor);
  let remaining = n - base.reduce((a, b) => a + b, 0);
  const fracIdx = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < remaining; i++) base[fracIdx[i][1]]++;
  return base;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  if (CLEAN) {
    await clean();
    await mongoose.disconnect();
    return;
  }

  const districts = DISTRICT_ID
    ? await District.find({ _id: DISTRICT_ID })
    : await District.find();

  if (DISTRICT_ID && districts.length === 0) {
    console.log(`No se encontro ningun distrito con el ID: ${DISTRICT_ID}`);
    await mongoose.disconnect();
    return;
  }

  const districtsWithCandidates = [];
  for (const d of districts) {
    const candidates = await Candidate.find({ district: d._id });
    if (candidates.length) districtsWithCandidates.push({ district: d, candidates });
  }

  if (districtsWithCandidates.length === 0) {
    console.log('No hay distritos con candidatos todavia. Agrega candidatos desde /admin primero.');
    await mongoose.disconnect();
    return;
  }

  // Reparte el total de votos entre los distritos, tambien al azar
  const votesPerDistrict = weightedDistribution(TOTAL_VOTES, districtsWithCandidates.length);

  let voteCounter = 0;
  const stamp = Date.now();

  for (let i = 0; i < districtsWithCandidates.length; i++) {
    const { district, candidates } = districtsWithCandidates[i];
    const nVotesHere = votesPerDistrict[i];
    if (nVotesHere === 0) continue;

    const perCandidate = weightedDistribution(nVotesHere, candidates.length);

    for (let c = 0; c < candidates.length; c++) {
      const nVotesForCandidate = perCandidate[c];
      for (let v = 0; v < nVotesForCandidate; v++) {
        voteCounter++;
        const fakeUser = await User.create({
          googleId: `${FAKE_PREFIX}${stamp}-${voteCounter}`,
          name: randomName(),
          email: `${FAKE_PREFIX}${stamp}-${voteCounter}@cumbre-ciudadana.local`,
          photo: '',
          provider: 'google'
        });
        await Vote.create({
          user: fakeUser._id,
          district: district._id,
          candidate: candidates[c]._id
        });
      }
    }
    console.log(`Distrito "${district.name}": ${nVotesHere} votos repartidos entre ${candidates.length} candidatos.`);
  }

  console.log(`Listo. ${voteCounter} votos de prueba creados en total.`);
  console.log('Para quitarlos despues: npm run seed:votes -- --clean');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

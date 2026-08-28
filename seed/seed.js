/**
 * Datos de arranque para la plataforma.
 * Los DISTRITOS federales usan la demarcación real del INE para la región
 * de Las Altas Montañas (cabeceras en Orizaba y Córdoba). Verifica los
 * distritos LOCALES y ajusta numeración/nombres desde el panel /admin,
 * ya que la distritación local puede cambiar por proceso electoral.
 *
 * Los CANDIDATOS son datos de EJEMPLO (ficticios) para que puedas ver la
 * plataforma funcionando. Reemplázalos por los reales desde /admin antes
 * de publicar.
 *
 * IMPORTANTE - PROTECCION CONTRA BORRADO ACCIDENTAL:
 * Este script se NIEGA a correr si ya existen distritos o candidatos en
 * la base de datos, para no borrar por accidente datos reales que ya
 * hayas cargado. Si de verdad quieres reiniciar todo (borrar lo que
 * exista y volver a poner los datos de ejemplo), corre en su lugar:
 *
 *   npm run seed -- --force
 *
 * Uso normal (primera vez, base de datos vacia):
 *   npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const Candidate = require('../models/Candidate');

const FORCE = process.argv.includes('--force');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const existingDistricts = await District.countDocuments();
  const existingCandidates = await Candidate.countDocuments();

  if ((existingDistricts > 0 || existingCandidates > 0) && !FORCE) {
    console.log('');
    console.log('ABORTADO: ya existen datos en la base de datos');
    console.log(`  - Distritos existentes: ${existingDistricts}`);
    console.log(`  - Candidatos existentes: ${existingCandidates}`);
    console.log('');
    console.log('No se toco nada, para proteger tus datos reales.');
    console.log('Si de verdad quieres borrar todo y reiniciar con datos de ejemplo, corre:');
    console.log('  npm run seed -- --force');
    console.log('');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('Conectado a MongoDB, sembrando datos...');

  await District.deleteMany({});
  await Candidate.deleteMany({});

  const districts = await District.insertMany([
    { name: 'Distrito Federal 15 - Orizaba', type: 'federal', number: 15 },
    { name: 'Distrito Federal 16 - Córdoba', type: 'federal', number: 16 },
    { name: 'Distrito Local - Orizaba', type: 'local', number: 1 },
    { name: 'Distrito Local - Córdoba', type: 'local', number: 2 },
  ]);

  const [f15, f16, l1, l2] = districts;

  await Candidate.insertMany([
    { name: 'Candidato de ejemplo A', party: 'Partido de ejemplo 1', district: f15._id, bio: 'Perfil de muestra. Reemplaza este registro desde el panel de administración.' },
    { name: 'Candidato de ejemplo B', party: 'Partido de ejemplo 2', district: f15._id, bio: 'Perfil de muestra. Reemplaza este registro desde el panel de administración.' },
    { name: 'Candidata de ejemplo C', party: 'Partido de ejemplo 3', district: f16._id, bio: 'Perfil de muestra. Reemplaza este registro desde el panel de administración.' },
    { name: 'Candidato de ejemplo D', party: 'Partido de ejemplo 1', district: l1._id, bio: 'Perfil de muestra. Reemplaza este registro desde el panel de administración.' },
    { name: 'Candidata de ejemplo E', party: 'Partido de ejemplo 2', district: l2._id, bio: 'Perfil de muestra. Reemplaza este registro desde el panel de administración.' },
  ]);

  console.log('Listo. Distritos y candidatos de ejemplo creados.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

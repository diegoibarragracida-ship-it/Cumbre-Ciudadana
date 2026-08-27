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
 * Ejecutar con:  npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const Candidate = require('../models/Candidate');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
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

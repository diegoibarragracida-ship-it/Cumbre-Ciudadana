/**
 * Respaldo manual de la base de datos.
 *
 * MongoDB Atlas en el plan gratuito (M0) NO hace respaldos automaticos.
 * Este script exporta tus distritos, candidatos, votos y comentarios a
 * un archivo JSON en la carpeta backups/, con fecha y hora en el nombre.
 *
 * Uso recomendado: correlo de vez en cuando (por ejemplo, cada vez que
 * cargues candidatos nuevos importantes) para tener con que restaurar
 * si algo sale mal.
 *
 *   npm run backup
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const District = require('../models/District');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const data = {
    exportedAt: new Date().toISOString(),
    districts: await District.find().lean(),
    candidates: await Candidate.find().lean(),
    votes: await Vote.find().lean(),
    comments: await Comment.find().lean(),
  };

  const dir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  console.log(`Respaldo guardado en: ${file}`);
  console.log(`  - ${data.districts.length} distritos`);
  console.log(`  - ${data.candidates.length} candidatos`);
  console.log(`  - ${data.votes.length} votos`);
  console.log(`  - ${data.comments.length} comentarios`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

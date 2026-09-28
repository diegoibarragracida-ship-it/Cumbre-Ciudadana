// Carga/actualiza distritos del catálogo estatal SIN borrar nada (los votos apuntan a distritos).
// Empata por (type, number). Si ya existe, solo completa cabecera/región/municipios.
//   npm run seed:veracruz -- --dry-run   (solo muestra)
//   npm run seed:veracruz
require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const catalog = require('../config/veracruz-districts');
const DRY = process.argv.includes('--dry-run');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const c of catalog) {
    const name = `Distrito ${c.type === 'federal' ? 'Federal' : 'Local'} ${c.number} - ${c.cabecera}`;
    const existing = await District.findOne({ type: c.type, number: c.number });
    const fields = { state: 'Veracruz', cabecera: c.cabecera, region: c.region || 'Veracruz',
      municipalities: c.municipalities || [], indigenous: !!c.indigenous };
    if (existing) {
      console.log(`[actualiza] ${existing.name}`);
      if (!DRY) await District.updateOne({ _id: existing._id }, { $set: fields });
    } else {
      console.log(`[crea]      ${name}`);
      if (!DRY) await District.create({ name, type: c.type, number: c.number, ...fields });
    }
  }
  console.log(DRY ? '\n(dry-run: no se escribió nada)' : '\nListo.');
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });

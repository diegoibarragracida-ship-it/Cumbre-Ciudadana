/**
 * Renombra los votantes de prueba que YA existen en la base de datos
 * (creados con una version anterior del seed, que los dejaba como
 * "Votante de prueba N") para que tengan nombres realistas en vez de
 * ese texto generico. No toca votos, no toca usuarios reales.
 *
 * Uso:
 *   npm run seed:rename-fake
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const FAKE_PREFIX = 'fake-voter-';

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

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const fakeUsers = await User.find({ googleId: { $regex: `^${FAKE_PREFIX}` } });

  if (fakeUsers.length === 0) {
    console.log('No hay votantes de prueba para renombrar.');
    await mongoose.disconnect();
    return;
  }

  for (const u of fakeUsers) {
    u.name = randomName();
    await u.save();
  }

  console.log(`Renombrados ${fakeUsers.length} votantes de prueba.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

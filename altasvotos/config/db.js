const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[MongoDB] Conectado correctamente');
  } catch (err) {
    console.error('[MongoDB] Error de conexion:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

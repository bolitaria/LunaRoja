const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const User = require('../models/User');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos.');

    const existingAdmin = await User.findOne({ where: { role: 'superadmin' } });
    if (existingAdmin) {
      console.log('⚠️ Ya existe un superadmin. No se creará otro.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'superadmin',
    });

    console.log(`✅ Superadmin creado: usuario "admin", contraseña "admin123"`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear superadmin:', error);
    process.exit(1);
  }
}

createAdmin();
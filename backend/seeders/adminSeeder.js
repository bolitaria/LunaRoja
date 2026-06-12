const bcrypt = require('bcrypt');
const { User } = require('../models');

async function seedAdminUser() {
  try {
    // Buscar si ya existe un administrador (puedes ajustar la condición según tu modelo)
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',     // si tu modelo requiere email
        role: 'admin',                  // o 'superadmin' si usas ese rol
        // otros campos obligatorios según tu modelo
      });
      console.log('✅ Usuario administrador creado por defecto (admin / admin123).');
    } else {
      console.log('ℹ️ Usuario administrador ya existe.');
    }
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error);
  }
}

module.exports = seedAdminUser;
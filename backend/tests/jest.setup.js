// Timeout generoso para todos los beforeAll/beforeEach
jest.setTimeout(30000);

// Contraseña por defecto si no se pasa como variable de entorno
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = 'admin123';
}

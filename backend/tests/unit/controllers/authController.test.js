const authController = require('../../../src/controllers/authController');

// Verificar que todas las funciones exportadas son definidas
describe('authController', () => {
  const functions = Object.keys(authController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof authController[fn]).toBe('function');
  });
});

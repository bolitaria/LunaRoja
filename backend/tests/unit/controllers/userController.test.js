const userController = require('../../../src/controllers/userController');

// Verificar que todas las funciones exportadas son definidas
describe('userController', () => {
  const functions = Object.keys(userController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof userController[fn]).toBe('function');
  });
});

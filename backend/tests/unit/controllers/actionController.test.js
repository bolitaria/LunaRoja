const actionController = require('../../../src/controllers/actionController');

// Verificar que todas las funciones exportadas son definidas
describe('actionController', () => {
  const functions = Object.keys(actionController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof actionController[fn]).toBe('function');
  });
});

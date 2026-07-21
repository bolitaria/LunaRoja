const bdsController = require('../../../src/controllers/bdsController');

// Verificar que todas las funciones exportadas son definidas
describe('bdsController', () => {
  const functions = Object.keys(bdsController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof bdsController[fn]).toBe('function');
  });
});

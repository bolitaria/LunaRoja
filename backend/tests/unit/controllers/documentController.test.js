const documentController = require('../../../src/controllers/documentController');

// Verificar que todas las funciones exportadas son definidas
describe('documentController', () => {
  const functions = Object.keys(documentController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof documentController[fn]).toBe('function');
  });
});

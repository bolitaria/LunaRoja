const linksController = require('../../../src/controllers/linksController');

// Verificar que todas las funciones exportadas son definidas
describe('linksController', () => {
  const functions = Object.keys(linksController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof linksController[fn]).toBe('function');
  });
});

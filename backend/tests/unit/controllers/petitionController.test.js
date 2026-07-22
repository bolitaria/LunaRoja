const petitionController = require('../../../src/controllers/petitionController');

// Verificar que todas las funciones exportadas son definidas
describe('petitionController', () => {
  const functions = Object.keys(petitionController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof petitionController[fn]).toBe('function');
  });
});

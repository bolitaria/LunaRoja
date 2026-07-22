const imageController = require('../../../src/controllers/imageController');

// Verificar que todas las funciones exportadas son definidas
describe('imageController', () => {
  const functions = Object.keys(imageController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof imageController[fn]).toBe('function');
  });
});

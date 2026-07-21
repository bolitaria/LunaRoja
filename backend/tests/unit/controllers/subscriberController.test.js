const subscriberController = require('../../../src/controllers/subscriberController');

// Verificar que todas las funciones exportadas son definidas
describe('subscriberController', () => {
  const functions = Object.keys(subscriberController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof subscriberController[fn]).toBe('function');
  });
});

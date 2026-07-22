const campaignController = require('../../../src/controllers/campaignController');

// Verificar que todas las funciones exportadas son definidas
describe('campaignController', () => {
  const functions = Object.keys(campaignController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof campaignController[fn]).toBe('function');
  });
});

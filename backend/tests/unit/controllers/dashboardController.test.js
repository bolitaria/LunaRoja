const dashboardController = require('../../../src/controllers/dashboardController');

// Verificar que todas las funciones exportadas son definidas
describe('dashboardController', () => {
  const functions = Object.keys(dashboardController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof dashboardController[fn]).toBe('function');
  });
});

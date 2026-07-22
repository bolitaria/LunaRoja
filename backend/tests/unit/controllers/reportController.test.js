const reportController = require('../../../src/controllers/reportController');

// Verificar que todas las funciones exportadas son definidas
describe('reportController', () => {
  const functions = Object.keys(reportController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof reportController[fn]).toBe('function');
  });
});

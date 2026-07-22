const dbAdminController = require('../../../src/controllers/dbAdminController');

// Verificar que todas las funciones exportadas son definidas
describe('dbAdminController', () => {
  const functions = Object.keys(dbAdminController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof dbAdminController[fn]).toBe('function');
  });
});

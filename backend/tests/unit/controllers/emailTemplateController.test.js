const emailTemplateController = require('../../../src/controllers/emailTemplateController');

// Verificar que todas las funciones exportadas son definidas
describe('emailTemplateController', () => {
  const functions = Object.keys(emailTemplateController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof emailTemplateController[fn]).toBe('function');
  });
});

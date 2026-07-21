const chatGroupController = require('../../../src/controllers/chatGroupController');

// Verificar que todas las funciones exportadas son definidas
describe('chatGroupController', () => {
  const functions = Object.keys(chatGroupController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof chatGroupController[fn]).toBe('function');
  });
});

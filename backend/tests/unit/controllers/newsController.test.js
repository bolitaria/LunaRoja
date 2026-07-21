const newsController = require('../../../src/controllers/newsController');

// Verificar que todas las funciones exportadas son definidas
describe('newsController', () => {
  const functions = Object.keys(newsController);
  test.each(functions)('%s es una función', (fn) => {
    expect(typeof newsController[fn]).toBe('function');
  });
});

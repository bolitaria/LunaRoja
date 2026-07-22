const middleware = require('../../../src/middlewares/upload');

describe('upload middleware', () => {
  test('exporta una función o un objeto', () => {
    if (typeof middleware === 'function') {
      expect(typeof middleware).toBe('function');
    } else {
      // si exporta un objeto con funciones (como multer)
      expect(typeof middleware).toBe('object');
    }
  });
});

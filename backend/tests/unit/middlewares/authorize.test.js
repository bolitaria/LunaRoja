const middleware = require('../../../src/middlewares/authorize');

describe('authorize middleware', () => {
  test('exporta una función o un objeto', () => {
    if (typeof middleware === 'function') {
      expect(typeof middleware).toBe('function');
    } else {
      // si exporta un objeto con funciones (como multer)
      expect(typeof middleware).toBe('object');
    }
  });
});

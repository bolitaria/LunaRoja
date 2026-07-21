const util = require('../../../src/utils/emailHelper');

describe('emailHelper', () => {
  test('debe exportar una función o un objeto', () => {
    expect(util).toBeDefined();
  });
});

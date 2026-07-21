const util = require('../../../src/utils/regionClassifier');

describe('regionClassifier', () => {
  test('debe exportar una función o un objeto', () => {
    expect(util).toBeDefined();
  });
});

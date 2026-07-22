const util = require('../../../src/utils/dynamicValidation');

describe('dynamicValidation', () => {
  test('debe exportar una función o un objeto', () => {
    expect(util).toBeDefined();
  });
});

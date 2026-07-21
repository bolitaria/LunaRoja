const service = require('../../../src/services/healthService');

describe('healthService service', () => {
  test('debe exportar una función o un objeto', () => {
    expect(service).toBeDefined();
  });
});

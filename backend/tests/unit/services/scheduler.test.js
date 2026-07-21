const service = require('../../../src/services/scheduler');

describe('scheduler service', () => {
  test('debe exportar una función o un objeto', () => {
    expect(service).toBeDefined();
  });
});

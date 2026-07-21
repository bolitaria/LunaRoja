const service = require('../../../src/services/queueService');

describe('queueService service', () => {
  test('debe exportar una función o un objeto', () => {
    expect(service).toBeDefined();
  });
});

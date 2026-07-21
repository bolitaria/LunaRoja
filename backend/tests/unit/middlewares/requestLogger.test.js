jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));
const middleware = require('../../../src/middlewares/requestLogger');

describe('requestLogger middleware', () => {
  test('exports functions', () => {
    expect(typeof middleware.assignId).toBe('function');
    expect(typeof middleware.requestLogger).toBe('function');
  });
});

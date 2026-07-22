// Mock de la dependencia real para evitar conexión a BD
jest.mock('../../../src/config/database', () => ({
  query: jest.fn().mockResolvedValue(),
}));
jest.mock('umzug', () => ({
  Umzug: jest.fn().mockImplementation(() => ({
    up: jest.fn().mockResolvedValue([]),
    down: jest.fn().mockResolvedValue([]),
  })),
  SequelizeStorage: jest.fn(),
}));

const runner = require('../../../src/services/migrationRunner');

describe('migrationRunner', () => {
  test('exports an object', () => {
    expect(typeof runner).toBe('object');
  });
});

const Model = require('../../../src/models/Document');

describe('Modelo Document', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

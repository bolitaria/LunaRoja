const Model = require('../../../src/models/News');

describe('Modelo News', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

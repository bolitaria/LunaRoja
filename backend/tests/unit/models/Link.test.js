const Model = require('../../../src/models/Link');

describe('Modelo Link', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

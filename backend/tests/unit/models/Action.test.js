const Model = require('../../../src/models/Action');

describe('Modelo Action', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

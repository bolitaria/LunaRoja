const Model = require('../../../src/models/BDS');

describe('Modelo BDS', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

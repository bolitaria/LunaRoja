const Model = require('../../../src/models/UserBDS');

describe('Modelo UserBDS', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

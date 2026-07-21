const Model = require('../../../src/models/UserAction');

describe('Modelo UserAction', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

const Model = require('../../../src/models/ChatGroup');

describe('Modelo ChatGroup', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

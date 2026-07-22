const Model = require('../../../src/models/Campaign');

describe('Modelo Campaign', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

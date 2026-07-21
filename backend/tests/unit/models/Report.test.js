const Model = require('../../../src/models/Report');

describe('Modelo Report', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

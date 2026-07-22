const Model = require('../../../src/models/ActionImage');

describe('Modelo ActionImage', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

const Model = require('../../../src/models/ColectivosAfines');

describe('Modelo ColectivosAfines', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

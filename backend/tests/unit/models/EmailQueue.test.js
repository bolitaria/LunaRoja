const Model = require('../../../src/models/EmailQueue');

describe('Modelo EmailQueue', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

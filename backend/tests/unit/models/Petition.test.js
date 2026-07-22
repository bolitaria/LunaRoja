const Model = require('../../../src/models/Petition');

describe('Modelo Petition', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

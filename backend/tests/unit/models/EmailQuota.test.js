const Model = require('../../../src/models/EmailQuota');

describe('Modelo EmailQuota', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

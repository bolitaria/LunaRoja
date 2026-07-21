const Model = require('../../../src/models/EmailTemplate');

describe('Modelo EmailTemplate', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

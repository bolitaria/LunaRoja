const Model = require('../../../src/models/SignatureHash');

describe('Modelo SignatureHash', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

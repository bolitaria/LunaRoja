const Model = require('../../../src/models/Subscriber');

describe('Modelo Subscriber', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

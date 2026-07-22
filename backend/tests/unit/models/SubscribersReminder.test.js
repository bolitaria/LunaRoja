const Model = require('../../../src/models/SubscribersReminder');

describe('Modelo SubscribersReminder', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

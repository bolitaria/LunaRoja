const Model = require('../../../src/models/UserCampaign');

describe('Modelo UserCampaign', () => {
  test('debe tener un nombre de tabla definido', () => {
    expect(Model.getTableName()).toBeTruthy();
  });
});

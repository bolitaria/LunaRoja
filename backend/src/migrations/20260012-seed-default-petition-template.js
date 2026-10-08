'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM "EmailTemplates" WHERE "associatedEvent" = 'petition' AND type = 'system' LIMIT 1;`
    );
    if (existing.length === 0) {
      await queryInterface.bulkInsert('EmailTemplates', [{
        name: 'Petición (por defecto)',
        subject: 'Firma la petición: {{title}}',
        body: '<h1>{{title}}</h1><p>{{content}}</p><a href="{{url}}" style="background-color: {{buttonColor}}; color: white; padding: 10px 20px; text-decoration: none;">Firmar petición</a>',
        variables: JSON.stringify(['title', 'content', 'url', 'buttonColor', 'headerColor', 'footerColor', 'backgroundColor']),
        type: 'system',
        associatedEvent: 'petition',
        isActive: true,
        headerColor: '#b91c1c',
        buttonColor: '#16a34a',
        footerColor: '#1f2937',
        backgroundColor: '#f3f4f6',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('EmailTemplates', { associatedEvent: 'petition', type: 'system' });
  }
};

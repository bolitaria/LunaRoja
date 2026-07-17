describe('Campañas', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('permite crear una campaña nueva', () => {
    cy.visit('/admin/campaigns/new');
    cy.get('input[name="name"]').type('Campaña E2E');
    cy.get('textarea[name="description"]').type('Descripción');
    cy.get('button[type="submit"]').click();
    cy.contains('Campaña creada correctamente').should('exist');
  });
});
describe('Peticiones', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('firma una petición públicamente', () => {
    cy.visit('/peticiones');
    cy.get('.petition-card').first().click();
    cy.get('input[name="fullName"]').type('Usuario E2E');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Firma registrada').should('exist');
  });
});
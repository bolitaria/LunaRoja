describe('Dashboard', () => {
  it('muestra el panel de administración después del login', () => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.visit('/admin/dashboard');
    cy.contains('Dashboard').should('exist');
    cy.contains('Estadísticas').should('exist');
  });
});

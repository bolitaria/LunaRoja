describe('Login', () => {
  it('permite iniciar sesión con credenciales correctas', () => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]', { timeout: 10000 }).should('be.visible').type('admin');
    cy.get('input[name="password"]').type(Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');
  });
});
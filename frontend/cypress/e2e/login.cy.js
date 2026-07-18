describe('Login', () => {
  it('permite iniciar sesión con credenciales correctas', () => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]', { timeout: 15000 }).type('admin');
    cy.get('input[name="password"]').type(Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
  });
});
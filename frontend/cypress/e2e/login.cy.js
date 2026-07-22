describe('Login', () => {
  it('muestra error con credenciales incorrectas', () => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]').type('wrong');
    cy.get('input[type="password"]').type('wrong');
    cy.get('button[type="submit"]').click();
    cy.contains(/credenciales inválidas|incorrectas|error/i, { timeout: 10000 }).should('exist');
  });

  it('redirige al dashboard después de un login exitoso', () => {
    cy.login('admin', 'admin123');
    cy.url().should('include', '/admin/dashboard');
  });
});

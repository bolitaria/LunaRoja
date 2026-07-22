describe('Admin Panel', () => {
  it('Iniciar sesión y navegar al dashboard', () => {
    cy.visit('/admin/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');
  });
});
describe('Dashboard', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]').type('admin');
    cy.get('input[type="password"]').type('admin123');
    cy.findByRole('button', { name: /ingresar/i }).click();
  });

  it('muestra el panel de administración', () => {
    cy.url().should('include', '/admin');
    cy.contains('Estadísticas').should('exist'); // Ajusta según el texto real del dashboard
  });
});
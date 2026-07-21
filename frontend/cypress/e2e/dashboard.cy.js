describe('Dashboard', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
    cy.findByLabelText('Usuario').type('admin');
    cy.findByLabelText('Contraseña').type('admin123');
    cy.findByRole('button', { name: /ingresar/i }).click();
  });

  it('muestra el panel de administración', () => {
    cy.url().should('include', '/admin');
    cy.contains('Estadísticas').should('exist'); // Ajusta según el texto real del dashboard
  });
});
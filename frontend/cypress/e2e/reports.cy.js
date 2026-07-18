describe('Reportes', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea un reporte', () => {
    cy.visit('/admin/reports/new');
    cy.get('input[name="title"]').type('Reporte E2E');
    cy.get('textarea[name="content"]').type('Contenido del reporte');
    cy.get('button[type="submit"]').click();
    cy.contains('Reporte creado').should('exist');
  });
});

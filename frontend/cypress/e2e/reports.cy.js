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

  it('edita un reporte', () => {
    cy.visit('/admin/reports');
    cy.get('a[href*="/edit"]').first().click();
    cy.get('input[name="title"]').clear().type('Reporte E2E Editado');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizado').should('exist');
  });

  it('elimina un reporte', () => {
    cy.visit('/admin/reports');
    cy.get('button[type="submit"]').contains(/eliminar/i).click();
    cy.get('button[type="submit"]').click();
    cy.contains('eliminado').should('exist');
  });

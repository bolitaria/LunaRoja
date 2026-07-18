describe('Documentos', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('sube un documento', () => {
    cy.visit('/admin/documents');
    cy.contains('Subir documento').click(); // o el botón correspondiente
    cy.get('input[type="file"]').attachFile('test-document.pdf'); // archivo en fixtures
    cy.get('input[name="title"]').type('Documento E2E');
    cy.get('button[type="submit"]').click();
    cy.contains('Documento subido').should('exist');
  });

  it('muestra la lista de documentos', () => {
    cy.visit('/admin/documents');
    cy.contains('Documentos').should('exist');
    cy.get('table').should('exist');
  });

  it('elimina un documento', () => {
    cy.visit('/admin/documents');
    cy.get('button').contains('Eliminar').click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminado').should('exist');
  });
});
describe('Documentos', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('sube un documento', () => {
    cy.visit('/admin/documents');
    cy.contains('Subir documento').click(); // ajusta según interfaz
    cy.get('input[type="file"]').attachFile('test-document.pdf');
    cy.get('input[name="title"]').type('Documento E2E');
    cy.get('button[type="submit"]').click();
    cy.contains('Documento subido').should('exist');
  });
});

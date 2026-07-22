describe('Imágenes', () => {
  beforeEach(() => {
    cy.login();
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('sube una imagen', () => {
    cy.visit('/admin/images');
    cy.contains('Subir imagen').click(); // o el botón correspondiente
    cy.get('input[type="file"]').attachFile('test-image.jpg'); // archivo en fixtures
    cy.get('button[type="submit"]').click();
    cy.contains('Imagen subida').should('exist');
  });

  it('muestra la lista de imágenes', () => {
    cy.visit('/admin/images');
    cy.contains('Imágenes').should('exist');
    cy.get('img').should('have.length.at.least', 1);
  });

  it('elimina una imagen', () => {
    cy.visit('/admin/images');
    cy.get('button[type="submit"]').contains(/eliminar/i).click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminada').should('exist');
  });
});
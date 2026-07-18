describe('Imágenes', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('sube una imagen', () => {
    cy.visit('/admin/images');
    cy.contains('Subir imagen').click(); // ajusta si hay un botón "Nueva imagen"
    cy.get('input[type="file"]').attachFile('test-image.jpg');
    cy.get('button[type="submit"]').click();
    cy.contains('Imagen subida').should('exist');
  });
});

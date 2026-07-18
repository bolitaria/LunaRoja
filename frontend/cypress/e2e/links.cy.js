describe('Enlaces', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea y edita un enlace', () => {
    cy.visit('/admin/links/new');
    cy.get('input[name="title"]').type('Enlace E2E');
    cy.get('input[name="url"]').type('https://example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Enlace creado').should('exist');

    cy.visit('/admin/links');
    cy.get('a').contains('Editar').click();
    cy.get('input[name="title"]').clear().type('Enlace E2E Editado');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizado').should('exist');
  });
});

  it('elimina un enlace', () => {
    cy.visit('/admin/links');
    cy.get('button').contains('Eliminar').click();
    cy.get('button[type="submit"]').click();
    cy.contains('eliminado').should('exist');
  });

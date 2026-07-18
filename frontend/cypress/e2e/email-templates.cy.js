describe('Plantillas de email', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea y edita una plantilla', () => {
    cy.visit('/admin/email-templates/new');
    cy.get('input[name="name"]').type('Plantilla E2E');
    cy.get('input[name="subject"]').type('Asunto E2E');
    cy.get('textarea[name="body"]').type('Cuerpo de prueba');
    cy.get('button[type="submit"]').click();
    cy.contains('Plantilla creada').should('exist');

    cy.visit('/admin/email-templates');
    cy.get('a').contains('Editar').click();
    cy.get('input[name="name"]').clear().type('Plantilla E2E Editada');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizada').should('exist');
  });
});

  it('elimina una plantilla', () => {
    cy.visit('/admin/email-templates');
    cy.get('button').contains('Eliminar').click();
    cy.get('button[type="submit"]').click();
    cy.contains('eliminada').should('exist');
  });

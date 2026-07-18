describe('Peticiones (admin)', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea una petición', () => {
    cy.visit('/admin/petitions/new');
    cy.get('input[name="title"]').type('Petición E2E');
    cy.get('textarea[name="content"]').type('Contenido de prueba');
    cy.get('input[name="target_emails"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Petición creada').should('exist');
  });

  it('edita una petición', () => {
    cy.visit('/admin/petitions');
    cy.get('a[href*="/admin/petitions/"][href*="/edit"]').first().click();
    cy.get('input[name="title"]').clear().type('Petición E2E Editada');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizada').should('exist');
  });

  it('elimina una petición', () => {
    cy.visit('/admin/petitions');
    cy.get('button[aria-label="Eliminar"]').first().click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminada').should('exist');
  });
});

// Conservamos el test público de firma (lo renombramos para que no choque)
describe('Firma pública de petición', () => {
  it('firma una petición públicamente', () => {
    cy.visit('/peticiones');
    cy.get('.petition-card').first().click();
    cy.get('input[name="fullName"]').type('Usuario E2E');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Firma registrada').should('exist');
  });
});

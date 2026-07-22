describe('Noticias', () => {
  beforeEach(() => {
    cy.login();
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea y edita una noticia', () => {
    cy.visit('/admin/news/new');
    cy.get('input[name="title"]').type('Noticia E2E');
    cy.get('textarea[name="content"]').type('Contenido de prueba');
    cy.get('button[type="submit"]').click();
    cy.contains('Noticia creada').should('exist');

    cy.visit('/admin/news');
    cy.get('a[href*="/edit"]').first().click();
    cy.get('input[name="title"]').clear().type('Noticia E2E Editada');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizada').should('exist');
  });
});

  it('elimina una noticia', () => {
    cy.visit('/admin/news');
    cy.get('button[type="submit"]').contains(/eliminar/i).click();
    cy.get('button[type="submit"]').click();
    cy.contains('eliminada').should('exist');
  });

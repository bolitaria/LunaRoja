describe('BDS', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea, edita y elimina una empresa BDS', () => {
    // Crear
    cy.visit('/admin/bds/new');
    cy.get('input[name="title"]').type('Empresa E2E');
    cy.get('textarea[name="content"]').type('Descripción de prueba');
    cy.get('button[type="submit"]').click();
    cy.contains('Empresa creada').should('exist');

    // Editar (asumimos que redirige al listado, tomamos el primer enlace de edición)
    cy.visit('/admin/bds');
    cy.get('a[href*="/edit"]').first().click();
    cy.get('input[name="title"]').clear().type('Empresa E2E Editada');
    cy.get('button[type="submit"]').click();
    cy.contains('actualizada').should('exist');

    // Eliminar (volver al listado, eliminar la primera)
    cy.visit('/admin/bds');
    cy.get('button[type="submit"]').contains(/eliminar/i).click();
    cy.get('button[type="submit"]').click(); // confirmación
    cy.contains('eliminada').should('exist');
  });
});

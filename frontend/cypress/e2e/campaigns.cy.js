describe('Campañas', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
    cy.get('[data-cy="username-input"]').type('admin');
    cy.get('input[type="password"]').type('admin123');
    cy.findByRole('button', { name: /ingresar/i }).click();
  });

  it('crea una campaña nueva', () => {
    cy.visit('/admin/campaigns/new');
    cy.findByLabelText('Nombre *').type('Campaña Cypress');
    cy.findByLabelText('Descripción').type('Descripción campaña');
    cy.findByRole('button', { name: /crear campaña/i }).click();
    cy.contains('Campaña creada').should('exist');
  });

  it('edita una campaña existente', () => {
    cy.visit('/admin/campaigns');
    cy.get('a[href*="/edit"]').first().click();
    cy.findByLabelText('Nombre *').clear().type('Editada Cypress');
    cy.findByRole('button', { name: /actualizar campaña/i }).click();
    cy.contains('Campaña actualizada').should('exist');
  });

  it('elimina una campaña', () => {
    cy.visit('/admin/campaigns');
    cy.get('[title="Eliminar"]').first().click();
    cy.findByRole('button', { name: /eliminar/i }).click();
    cy.contains('Campaña eliminada').should('exist');
  });
});
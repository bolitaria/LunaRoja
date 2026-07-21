describe('BDS', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
    cy.findByLabelText('Usuario').type('admin');
    cy.findByLabelText('Contraseña').type('admin123');
    cy.findByRole('button', { name: /ingresar/i }).click();
  });

  it('crea, edita y elimina una empresa BDS', () => {
    cy.visit('/admin/bds/new');
    cy.findByLabelText('Nombre *').type('BDS Cypress');
    cy.findByLabelText('Descripción').type('Descripción BDS');
    cy.findByRole('button', { name: /crear campaña bds/i }).click();
    cy.contains('Campaña BDS creada').should('exist');

    cy.visit('/admin/bds');
    cy.get('a[href*="/edit"]').first().click();
    cy.findByLabelText('Nombre *').clear().type('BDS Editada');
    cy.findByRole('button', { name: /guardar cambios/i }).click();
    cy.contains('actualizada').should('exist');

    cy.visit('/admin/bds');
    cy.get('[title="Eliminar"]').first().click();
    cy.findByRole('button', { name: /eliminar/i }).click();
    cy.contains('eliminada').should('exist');
  });
});
describe('Colectivos Afines', () => {
    beforeEach(() => { cy.login(); });
  });

  it('crea un nuevo colectivo y verifica en footer', () => {
    cy.visit('/admin/colectivos-afines/new');
    cy.findByLabelText('Nombre *').type('Colectivo Cypress');
    cy.findByLabelText('Enlace *').type('https://colectivo.org');
    cy.findByRole('button', { name: /crear/i }).click();
    cy.contains('creado correctamente').should('exist');
  });

  it('edita un colectivo', () => {
    cy.visit('/admin/colectivos-afines');
    cy.get('a[href*="/edit"]').first().click();
    cy.findByLabelText('Nombre *').clear().type('Editado');
    cy.findByRole('button', { name: /guardar/i }).click();
    cy.contains('actualizado correctamente').should('exist');
  });

  it('elimina un colectivo', () => {
    cy.visit('/admin/colectivos-afines');
    cy.get('[title="Eliminar"]').first().click();
    cy.findByRole('button', { name: /eliminar/i }).click();
    cy.contains('eliminado correctamente').should('exist');
  });
});
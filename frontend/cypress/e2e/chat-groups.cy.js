describe('Grupos de chat', () => {
    beforeEach(() => { cy.login(); });
  });

  it('crea un grupo de chat', () => {
    cy.visit('/admin/chat-groups/new');
    cy.findByLabelText('Enlace de invitación *').type('https://chat.whatsapp.com/invite');
    cy.findByLabelText('Plataforma').select('whatsapp');
    cy.findByRole('button', { name: /crear grupo/i }).click();
    cy.contains('Grupo creado').should('exist');
  });

  it('edita un grupo de chat', () => {
    cy.visit('/admin/chat-groups');
    cy.get('a[href*="/edit"]').first().click();
    cy.findByLabelText('Enlace de invitación *').clear().type('https://t.me/nuevo');
    cy.findByRole('button', { name: /guardar/i }).click();
    cy.contains('actualizado').should('exist');
  });

  it('elimina un grupo de chat', () => {
    cy.visit('/admin/chat-groups');
    cy.get('[title="Eliminar"]').first().click();
    cy.findByRole('button', { name: /eliminar/i }).click();
    cy.contains('eliminado').should('exist');
  });
});
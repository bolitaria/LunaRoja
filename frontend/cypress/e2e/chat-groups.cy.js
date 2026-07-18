describe('Grupos de chat', () => {
  beforeEach(() => {
    cy.login('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
  });

  it('crea un grupo de chat', () => {
    cy.visit('/admin/chatGroups/new');
    cy.get('input[name="name"]').type('Grupo E2E');
    cy.get('input[name="inviteLink"]').type('https://chat.example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Grupo creado').should('exist');
  });
});

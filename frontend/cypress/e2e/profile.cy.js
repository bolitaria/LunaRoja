describe('Perfil de usuario', () => {
  beforeEach(() => {
    cy.login();
    cy.login('admin', 'admin123');
  });

  it('permite cambiar la contraseña', () => {
    cy.visit('/admin/profile');
    cy.contains('Cambiar contraseña').should('exist');
    cy.findByLabelText('Contraseña actual').type('admin123');
    cy.findByLabelText('Nueva contraseña').type('newpass123');
    cy.findByLabelText('Confirmar nueva contraseña').type('newpass123');
    cy.findByRole('button', { name: /cambiar contraseña/i }).click();
    cy.contains('Contraseña actualizada').should('exist');

    // Volver a la contraseña original para no romper el resto de tests
    cy.findByLabelText('Contraseña actual').clear().type('newpass123');
    cy.findByLabelText('Nueva contraseña').clear().type('admin123');
    cy.findByLabelText('Confirmar nueva contraseña').clear().type('admin123');
    cy.findByRole('button', { name: /cambiar contraseña/i }).click();
    cy.contains('Contraseña actualizada').should('exist');
  });

  it('muestra los datos del usuario', () => {
    cy.visit('/admin/profile');
    cy.contains('admin').should('exist'); // nombre de usuario
    cy.contains('superadmin').should('exist'); // rol
  });
});

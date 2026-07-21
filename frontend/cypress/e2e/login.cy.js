describe('Login', () => {
  it('muestra error con credenciales incorrectas', () => {
    cy.visit('/admin/login');
    // Esperamos que la página de login se cargue completamente
    cy.findByLabelText('Usuario').should('be.visible').type('usuario_falso');
    cy.findByLabelText('Contraseña').type('contraseña_incorrecta', { log: false });
    cy.findByRole('button', { name: /ingresar/i }).click();
    // El mensaje de error debe aparecer (ajusta el texto según tu implementación)
    cy.contains('Credenciales inválidas').should('exist');
  });

  it('redirige al dashboard después de un login exitoso', () => {
    // Usamos el comando que interactúa con la interfaz real
    cy.loginUI('admin', Cypress.env('ADMIN_PASSWORD') || 'admin123');
    // Verificamos que estamos en una página de administración
    cy.url().should('include', '/admin');
    // Comprobamos que aparece un elemento característico del dashboard
    cy.contains('Estadísticas').should('exist');
  });
});
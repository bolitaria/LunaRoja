import '@testing-library/cypress/add-commands';

// Login rápido via API (recomendado para la mayoría de los tests)
Cypress.Commands.add('login', (username, password) => {
  cy.request('POST', `${Cypress.env('API_URL') || 'http://localhost:5000'}/api/auth/login`, {
    username,
    password,
  }).then((response) => {
    // Ajusta la clave exacta que usa tu interceptor de Axios (auth_token o token)
    const token = response.body.token || response.body.accessToken;
    // Guardamos en localStorage dentro de la página
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('user', JSON.stringify(response.body.user));
    });
    // Navegamos a una ruta protegida para activar la sesión
    cy.visit('/admin');
  });
});

// Login por UI (solo para probar el formulario de login)
Cypress.Commands.add('loginUI', (username, password) => {
  cy.visit('/admin/login');
  cy.findByLabelText('Usuario').should('be.visible').type(username);
  cy.findByLabelText('Contraseña').type(password, { log: false });
  cy.findByRole('button', { name: /ingresar/i }).click();
  // Esperar que aparezca un elemento propio del dashboard
  cy.contains('Estadísticas', { timeout: 15000 }).should('exist');
});
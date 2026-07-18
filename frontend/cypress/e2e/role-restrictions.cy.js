describe('Restricciones de roles en la UI', () => {
  const adminPass = Cypress.env('ADMIN_PASSWORD') || 'admin123';

  // Obtenemos un token de admin para crear usuarios de prueba
  let superadminToken;

  before(() => {
    cy.request('POST', 'http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: adminPass,
    }).then((response) => {
      superadminToken = response.body.token;
    });
  });

  // Usuarios que vamos a crear y luego limpiar
  const users = [];

  // Función para crear un usuario vía API
  const createUser = (username, password, email, role) => {
    return cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users',
      headers: { Authorization: `Bearer ${superadminToken}` },
      body: { username, password, email, role },
    }).then((res) => res.body.id);
  };

  // Función para eliminar un usuario vía API
  const deleteUser = (id) => {
    return cy.request({
      method: 'DELETE',
      url: `http://localhost:5000/api/users/${id}`,
      headers: { Authorization: `Bearer ${superadminToken}` },
    });
  };

  after(() => {
    // Limpieza de usuarios creados
    users.forEach((id) => deleteUser(id));
  });

  describe('action_admin', () => {
    let actionAdminPass = 'Test1234';
    let actionAdminUsername = `action_e2e_${Date.now()}`;

    before(() => {
      createUser(actionAdminUsername, actionAdminPass, `${actionAdminUsername}@test.com`, 'action_admin')
        .then((id) => users.push(id));
    });

    it('no puede acceder a la página de creación de campañas', () => {
      cy.loginAs(actionAdminUsername, actionAdminPass);
      cy.visit('/admin/campaigns/new', { failOnStatusCode: false });
      // Esperamos ser redirigidos al dashboard o ver un mensaje de error
      cy.url().should('not.include', '/admin/campaigns/new');
      // Opcional: verificar que aparece un texto de acceso denegado
      // cy.contains('No tienes permisos').should('exist');
    });

    it('no ve el enlace de Campañas en el menú', () => {
      cy.loginAs(actionAdminUsername, actionAdminPass);
      cy.visit('/admin/dashboard');
      cy.get('nav').should('not.contain', 'Campañas');
    });
  });

  describe('campaign_admin', () => {
    let campaignAdminPass = 'Test1234';
    let campaignAdminUsername = `campaign_e2e_${Date.now()}`;

    before(() => {
      createUser(campaignAdminUsername, campaignAdminPass, `${campaignAdminUsername}@test.com`, 'campaign_admin')
        .then((id) => users.push(id));
    });

    it('no puede crear usuarios', () => {
      cy.loginAs(campaignAdminUsername, campaignAdminPass);
      cy.visit('/admin/users/new', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin/users/new');
    });
  });

});

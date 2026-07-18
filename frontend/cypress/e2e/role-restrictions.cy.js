describe('Restricciones de roles en la UI', () => {
  const adminPass = Cypress.env('ADMIN_PASSWORD') || 'admin123';
  let superadminToken;

  before(() => {
    // 1. Esperar a que el backend esté listo
    cy.request({ url: 'http://localhost:5000/health', retryOnStatusCodeFailure: true, timeout: 30000 })
      .its('status')
      .should('eq', 200);
    // 2. Obtener token del superadmin
    cy.request('POST', 'http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: adminPass,
    }).then((response) => {
      superadminToken = response.body.token;
    });
  });

  const users = [];

  const createUser = (username, password, email, role) => {
    return cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/users',
      headers: { Authorization: `Bearer ${superadminToken}` },
      body: { username, password, email, role },
    }).then((res) => {
      users.push(res.body.id);
      return res.body.id;
    });
  };

  const deleteUser = (id) => {
    return cy.request({
      method: 'DELETE',
      url: `http://localhost:5000/api/users/${id}`,
      headers: { Authorization: `Bearer ${superadminToken}` },
      failOnStatusCode: false, // ignorar si ya fue eliminado
    });
  };

  after(() => {
    // Limpiar usuarios creados
    users.forEach((id) => deleteUser(id));
  });

  describe('action_admin', () => {
    const actionAdminPass = 'Test1234';
    const actionAdminUsername = `action_e2e_${Date.now()}`;

    before(() => {
      createUser(actionAdminUsername, actionAdminPass, `${actionAdminUsername}@test.com`, 'action_admin');
    });

    it('no puede acceder a la página de creación de campañas', () => {
      cy.loginAs(actionAdminUsername, actionAdminPass);  // usa el comando personalizado (ya corregido)
      cy.visit('/admin/campaigns/new', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin/campaigns/new');
    });

    it('no ve el enlace de Campañas en el menú', () => {
      cy.loginAs(actionAdminUsername, actionAdminPass);
      cy.visit('/admin/dashboard');
      cy.get('nav').should('not.contain', 'Campañas');
    });
  });

  describe('campaign_admin', () => {
    const campaignAdminPass = 'Test1234';
    const campaignAdminUsername = `campaign_e2e_${Date.now()}`;

    before(() => {
      createUser(campaignAdminUsername, campaignAdminPass, `${campaignAdminUsername}@test.com`, 'campaign_admin');
    });

    it('no puede crear usuarios', () => {
      cy.loginAs(campaignAdminUsername, campaignAdminPass);
      cy.visit('/admin/users/new', { failOnStatusCode: false });
      cy.url().should('not.include', '/admin/users/new');
    });
  });
});
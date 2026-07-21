const request = require('supertest');
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken;

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: ADMIN_PASSWORD });
  adminToken = res.body.token;
}, 15000);

describe('Casos límite (edge cases)', () => {
  test('Acción con fecha en el pasado lejano', async () => {
    const res = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Acción antigua', datetime: '1900-01-01T00:00:00Z', locationType: 'presencial', address: 'Calle Antigua' });
    expect(res.status).toBe(201);
  });

  test('Acción sin locationType se crea con valor por defecto', async () => {
    const res = await request(API_URL)
      .post('/api/actions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Sin tipo', datetime: '2027-01-01T10:00:00Z', address: 'Calle' });
    expect(res.status).toBe(201);
  });

  test('Obtener acción con ID no numérico devuelve 400', async () => {
    const res = await request(API_URL).get('/api/actions/abc');
    expect(res.status).toBe(400);
  });

  test('Crear campaña con nombre excesivamente largo (300 caracteres)', async () => {
    const longName = 'A'.repeat(300);
    const res = await request(API_URL)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: longName, description: 'Campaña larga' });
    expect([201, 500]).toContain(res.status);
  });

  test('Actualizar campaña con ID inexistente', async () => {
    const res = await request(API_URL)
      .put('/api/campaigns/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Inexistente' });
    expect(res.status).toBe(404);
  });

  test('Crear BDS sin nombre', async () => {
    const res = await request(API_URL)
      .post('/api/bds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Sin nombre' });
    expect(res.status).toBe(400);
  });

  test('Crear noticia sin contenido (requiere contenido)', async () => {
    const res = await request(API_URL)
      .post('/api/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Noticia vacía' });
    expect(res.status).toBe(400);
  });

  test('Crear reporte tipo blog sin contenido ni archivo ni descripción', async () => {
    const res = await request(API_URL)
      .post('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Blog vacío', type: 'blog' });
    expect(res.status).toBe(400);
  });

  test('Reporte con tipo inválido', async () => {
    const res = await request(API_URL)
      .post('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Tipo raro', type: 'invalid' });
    expect([201, 400]).toContain(res.status);
  });

  test('Suscribir email con formato incorrecto', async () => {
    const res = await request(API_URL).post('/api/subscribers').send({ email: 'no-es-email' });
    expect(res.status).toBe(400);
  });

  test('Suscribir email vacío', async () => {
    const res = await request(API_URL).post('/api/subscribers').send({ email: '' });
    expect(res.status).toBe(400);
  });

  test('Login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'equivocada' });
    expect([401, 403]).toContain(res.status);
  });

  test('Acceder a ruta protegida sin token devuelve 401', async () => {
    const res = await request(API_URL).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('Token manipulado en ruta protegida devuelve 401', async () => {
    const res = await request(API_URL)
      .get('/api/users/me')
      .set('Authorization', 'Bearer esto-no-es-jwt');
    expect(res.status).toBe(401);
  });

  test('Paginación con offset negativo', async () => {
    const res = await request(API_URL).get('/api/actions?limit=5&offset=-5');
    expect(res.status).toBe(200);
  });

  test('Límite de página excesivamente alto (10000)', async () => {
    const res = await request(API_URL).get('/api/actions?limit=10000');
    expect(res.status).toBe(200);
  });

  test('Crear colectivo sin imagen requiere imagen', async () => {
    const res = await request(API_URL)
      .post('/api/colectivosAfines')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Colectivo sin logo')
      .field('link', 'https://example.org');
    expect(res.status).toBe(400);
  });

  test('Crear colectivo con imagen funciona', async () => {
    const res = await request(API_URL)
      .post('/api/colectivosAfines')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Colectivo con imagen')
      .field('link', 'https://example.org')
      .attach('imagen', Buffer.from('fake-image'), 'test.png');
    expect(res.status).toBe(201);
  });

  test('Actualizar colectivo con ID inexistente', async () => {
    const res = await request(API_URL)
      .put('/api/colectivosAfines/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('name', 'Fantasma');
    expect(res.status).toBe(404);
  });
});

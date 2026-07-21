import api, { fetchCsrfToken } from '../../../src/lib/axios';
import MockAdapter from 'axios-mock-adapter';

// Instalar axios-mock-adapter si no está: npm install --save-dev axios-mock-adapter
let mock;

beforeEach(() => {
  mock = new MockAdapter(api);
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  mock.restore();
});

describe('Axios instance and interceptors', () => {
  test('should add Authorization header if token exists', async () => {
    localStorage.setItem('token', 'fake-token');
    mock.onGet('/test').reply(config => {
      expect(config.headers.Authorization).toBe('Bearer fake-token');
      return [200, {}];
    });
    await api.get('/test');
  });

  test('should not add Authorization header if no token', async () => {
    mock.onGet('/test').reply(config => {
      expect(config.headers.Authorization).toBeUndefined();
      return [200, {}];
    });
    await api.get('/test');
  });

  test('should add CSRF token for petition sign requests', async () => {
    localStorage.setItem('token', 'abc');
    sessionStorage.setItem('csrf_token', 'csrf123');
    mock.onPost('/petitions/123/sign').reply(config => {
      expect(config.headers['x-csrf-token']).toBe('csrf123');
      return [200, {}];
    });
    await api.post('/petitions/123/sign');
  });

  test('should redirect to login on 401 in admin routes', async () => {
    localStorage.setItem('token', 'expired');
    delete window.location;
    window.location = { href: '' };
    mock.onGet('/admin/some').reply(401);

    // Simular que estamos en una ruta de admin
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin/dashboard' },
      writable: true,
    });

    try {
      await api.get('/admin/some');
    } catch (e) {
      // expected
    }
    expect(window.location.href).toBe('/admin/login');
  });

  test('fetchCsrfToken should store token in sessionStorage', async () => {
    mock.onGet('/petitions/csrf-token').reply(200, { csrfToken: 'new-csrf' });
    await fetchCsrfToken();
    expect(sessionStorage.getItem('csrf_token')).toBe('new-csrf');
  });
});

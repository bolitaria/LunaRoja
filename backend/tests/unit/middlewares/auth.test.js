/**
 * Tests del middleware de autenticación (`auth.js`).
 *
 * Nota sobre seguridad: el fichero define `process.env.JWT_SECRET = 'test_secret'`,
 * un secreto de prueba que NUNCA se usa fuera de estos tests. Semgrep marca las
 * llamadas a `jwt.sign()` con la regla `jwt-hardcode` como falsos positivos porque
 * hace dataflow desde la asignación de la env var. Cada `jwt.sign` lleva su propio
 * `nosemgrep` para documentar la excepción sin silenciar el fichero completo.
 */

const jwt = require('jsonwebtoken');
const { authenticate, isAdmin } = require('../../../src/middlewares/auth');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/User');

// Secreto de prueba — solo durante la ejecución de los tests.
// `nosemgrep` evita el falso positivo de la regla jwt-hardcode de Semgrep.
process.env.JWT_SECRET = 'test_secret'; // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn(),          // Express req.header
      cookies: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    User.findByPk.mockClear();
  });

  describe('authenticate', () => {
    it('debe devolver 401 si no hay token', () => {
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe verificar un token válido desde header', async () => {
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET); // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
      req.header.mockReturnValue(`Bearer ${token}`);
      User.findByPk.mockResolvedValue({ id: 1, role: 'superadmin' });

      await authenticate(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    it('debe usar cookie si no hay header', async () => {
      const token = jwt.sign({ id: 2 }, process.env.JWT_SECRET); // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
      req.cookies.access_token = token;
      User.findByPk.mockResolvedValue({ id: 2, role: 'campaign_admin' });

      await authenticate(req, res, next);
      expect(req.user.id).toBe(2);
      expect(next).toHaveBeenCalled();
    });

    it('debe devolver 401 para token inválido', async () => {
      req.header.mockReturnValue('Bearer tokeninvalido');
      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe devolver 401 si el usuario no existe', async () => {
      const token = jwt.sign({ id: 99 }, process.env.JWT_SECRET); // nosemgrep: javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret
      req.header.mockReturnValue(`Bearer ${token}`);
      User.findByPk.mockResolvedValue(null);
      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('isAdmin', () => {
    it('permite acceso a superadmin', () => {
      req.user = { role: 'superadmin' };
      isAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('permite acceso a campaign_admin', () => {
      req.user = { role: 'campaign_admin' };
      isAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('deniega acceso a action_admin', () => {
      req.user = { role: 'action_admin' };
      isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deniega acceso si no hay usuario', () => {
      req.user = null;
      isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

// Limpieza: restaurar la variable de entorno tras los tests.
afterAll(() => {
  delete process.env.JWT_SECRET;
});
const { create, update, deleteColectivo, getAll, getById } = require('../../../src/controllers/colectivosAfinesController');
const { ColectivoAfines } = require('../../../src/models');

jest.mock('../../../src/models', () => ({
  ColectivoAfines: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('ColectivosAfines Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, file: null, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('crea colectivo con link e imagen', async () => {
      req.body = { link: 'https://test.com', nombre: 'Test' };
      req.file = { filename: 'test.png' };
      ColectivoAfines.create.mockResolvedValue({ id: 1, nombre: 'Test', imagen: '/uploads/colectivos/test.png', link: 'https://test.com' });
      await create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('falla si falta imagen', async () => {
      req.body = { link: 'https://test.com' };
      await create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('falla si link está vacío', async () => {
      req.body = { link: '' };
      req.file = { filename: 'test.png' };
      await create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('maneja error de base de datos', async () => {
      req.body = { link: 'https://test.com', nombre: 'Test' };
      req.file = { filename: 'test.png' };
      ColectivoAfines.create.mockRejectedValue(new Error('DB error'));
      await create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll', () => {
    test('devuelve lista de colectivos', async () => {
      ColectivoAfines.findAll.mockResolvedValue([{ id: 1, nombre: 'Test', imagen: '/img.png', link: 'https://test.com' }]);
      await getAll(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    test('maneja error de base de datos', async () => {
      ColectivoAfines.findAll.mockRejectedValue(new Error('DB error'));
      await getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    test('devuelve 404 si no existe', async () => {
      ColectivoAfines.findByPk.mockResolvedValue(null);
      req.params.id = 999;
      await getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('maneja error de base de datos', async () => {
      ColectivoAfines.findByPk.mockRejectedValue(new Error('DB error'));
      req.params.id = 1;
      await getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    test('actualiza colectivo', async () => {
      const mockItem = { nombre: 'Old', link: 'old', imagen: '/old.png', save: jest.fn() };
      ColectivoAfines.findByPk.mockResolvedValue(mockItem);
      req.params.id = 1;
      req.body = { nombre: 'New', link: 'new' };
      await update(req, res);
      expect(mockItem.nombre).toBe('New');
      expect(mockItem.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve 404 si no existe', async () => {
      ColectivoAfines.findByPk.mockResolvedValue(null);
      req.params.id = 999;
      await update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    test('elimina colectivo', async () => {
      const mockItem = { imagen: '/img.png', destroy: jest.fn() };
      ColectivoAfines.findByPk.mockResolvedValue(mockItem);
      req.params.id = 1;
      await deleteColectivo(req, res);
      expect(mockItem.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('devuelve 404 si no existe', async () => {
      ColectivoAfines.findByPk.mockResolvedValue(null);
      req.params.id = 999;
      await deleteColectivo(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

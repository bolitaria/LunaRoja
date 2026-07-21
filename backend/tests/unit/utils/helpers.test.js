const { toInt, isValidId, safeFilePath, deleteFileSafe } = require('../../../src/utils/helpers');
const path = require('path');
const fs = require('fs');

jest.mock('fs');

describe('helpers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('toInt convierte string a número', () => {
    expect(toInt('123')).toBe(123);
  });

  test('toInt devuelve null para valor no numérico', () => {
    expect(toInt('abc')).toBeNull();
  });

  test('toInt devuelve null para undefined', () => {
    expect(toInt(undefined)).toBeNull();
  });

  test('isValidId devuelve true para número positivo', () => {
    expect(isValidId(5)).toBe(true);
    expect(isValidId('10')).toBe(true);
  });

  test('isValidId devuelve false para null/negativo/undefined', () => {
    expect(isValidId(null)).toBe(false);
    expect(isValidId(-1)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
  });

  test('safeFilePath devuelve ruta normalizada', () => {
    const safe = safeFilePath('file.txt', '/safe/root');
    expect(safe).toBe(path.normalize('/safe/root/file.txt'));
  });

  test('safeFilePath con path traversal devuelve solo el nombre base', () => {
    const safe = safeFilePath('../../../etc/passwd', '/safe/root');
    expect(safe).toBe(path.normalize('/safe/root/passwd'));
  });

  test('deleteFileSafe elimina archivo correctamente', () => {
    fs.unlink.mockImplementation((_, cb) => cb(null));
    deleteFileSafe('test.txt', '/safe/root');
    expect(fs.unlink).toHaveBeenCalled();
  });

  test('deleteFileSafe no hace nada si filePath es null', () => {
    deleteFileSafe(null, '/safe/root');
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  test('deleteFileSafe maneja error de unlink', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    fs.unlink.mockImplementation((_, cb) => cb(new Error('EACCES')));
    deleteFileSafe('test.txt', '/safe/root');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al eliminar archivo:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});

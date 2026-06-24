// src/utils/helpers.js
const path = require('path');
const fs = require('fs');

/**
 * Convierte un valor a entero, devuelve null si no es un número válido
 */
const toInt = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val);
  return isNaN(num) ? null : num;
};

/**
 * Valida que un ID sea un número entero positivo
 */
const isValidId = (val) => {
  const num = toInt(val);
  return num !== null && num > 0;
};

/**
 * Normaliza y verifica que una ruta de archivo esté dentro del directorio base
 * @param {string} filePath - Ruta relativa o absoluta del archivo
 * @param {string} baseDir - Directorio base permitido (ej. 'uploads/documents')
 * @returns {string|null} Ruta normalizada si es segura, o null
 */
const safeFilePath = (filePath, baseDir) => {
  if (!filePath) return null;
  const resolved = path.resolve(baseDir, path.basename(filePath));
  const normalized = path.normalize(resolved);
  const baseNormalized = path.normalize(baseDir);
  if (!normalized.startsWith(baseNormalized)) {
    return null;
  }
  return normalized;
};

/**
 * Elimina un archivo de forma segura
 */
const deleteFileSafe = (filePath, baseDir) => {
  if (!filePath) return;
  const safePath = safeFilePath(filePath, baseDir);
  if (!safePath) return;
  fs.unlink(safePath, (err) => {
    if (err) console.error('Error al eliminar archivo:', err);
  });
};

module.exports = {
  toInt,
  isValidId,
  safeFilePath,
  deleteFileSafe,
};
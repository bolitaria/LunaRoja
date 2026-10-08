const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Report — puede ser blog o reporte.
 *
 * Contenido (uno u otro):
 *  - Modo texto: `content` relleno, sin Document asociado.
 *  - Modo fichero: `content` vacío, 1 Document con `reportId` (PDF subido).
 *
 * `type`:
 *  - 'blog'   → firma obligatoria (`author`)
 *  - 'report' → bibliografía obligatoria (`bibliography`, mín 1 / máx 5)
 *
 * `bibliography` es un array JSONB de entradas:
 *   [{ "url": "https://...", "source": "Nombre opcional" }, ...]
 */
const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  content: { type: DataTypes.TEXT },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  type: {
    type: DataTypes.ENUM('blog', 'report'),
    defaultValue: 'blog',
    allowNull: false,
  },
  source: { type: DataTypes.STRING, allowNull: true },
  author: { type: DataTypes.STRING, allowNull: true },
  publishedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  // Array de fuentes bibliográficas (solo type='report')
  bibliography: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    validate: {
      isValidBibliography(value) {
        if (value === null || value === undefined) return;
        if (!Array.isArray(value)) {
          throw new Error('bibliography debe ser un array');
        }
        for (const entry of value) {
          if (typeof entry !== 'object' || entry === null) {
            throw new Error('Cada entrada de bibliography debe ser un objeto {url, source?}');
          }
          if (typeof entry.url !== 'string' || entry.url.trim() === '') {
            throw new Error('Cada entrada de bibliography debe tener una url');
          }
        }
      },
    },
  },
}, { timestamps: true });

module.exports = Report;

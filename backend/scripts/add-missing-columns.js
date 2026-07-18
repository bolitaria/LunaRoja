// Script para añadir columnas faltantes en CI (email_template_id, createdAt/updatedAt)
const { Sequelize } = require('sequelize');
const config = require('../config/database'); // Ajusta si tu config se exporta de otra forma

async function run() {
  const sequelize = new Sequelize(config);

  try {
    // Añadir email_template_id a petitions si no existe
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'petitions' AND column_name = 'email_template_id'
        ) THEN
          ALTER TABLE petitions ADD COLUMN email_template_id INTEGER
            REFERENCES email_templates(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // Añadir createdAt y updatedAt a email_quota si no existen
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'email_quota' AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE email_quota ADD COLUMN "createdAt" timestamptz NOT NULL DEFAULT now();
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'email_quota' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE email_quota ADD COLUMN "updatedAt" timestamptz NOT NULL DEFAULT now();
        END IF;
      END
      $$;
    `);

    console.log('✅ Columnas faltantes agregadas correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();

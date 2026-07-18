const { Sequelize } = require('sequelize');

async function run() {
  // Usar variables de entorno (mismas que CI define)
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'lunaroja',
    password: process.env.DB_PASSWORD || 'lunaroja123',
    database: process.env.DB_NAME || 'lunaroja',
    logging: false,
  });

  try {
    // 1. email_template_id en petitions
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

    // 2. createdAt y updatedAt en email_quota
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

    console.log('✅ Columnas agregadas correctamente.');
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();

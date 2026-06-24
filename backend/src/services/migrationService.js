const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

const MIGRATIONS_PATH = path.join(__dirname, 'migrations');

const runMigrations = async () => {
  const transaction = await sequelize.transaction();
  try {
    const executed = new Set();
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta"', { transaction });
    rows.forEach((row) => executed.add(row.name));

    const migrationFiles = fs
      .readdirSync(MIGRATIONS_PATH)
      .filter((file) => file.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      if (executed.has(file)) continue;
      const migration = require(path.join(MIGRATIONS_PATH, file));
      if (!migration.up || typeof migration.up !== 'function') {
        throw new Error(`Migration ${file} does not export an up function`);
      }
      console.log(`🔄 Running migration ${file}`);
      await migration.up(sequelize.getQueryInterface(), Sequelize, transaction);
      await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name)', {
        replacements: { name: file },
        transaction,
      });
    }

    await transaction.commit();
    console.log('✅ Migrations completed');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

module.exports = { runMigrations };

const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

const MIGRATIONS_PATH = path.join(__dirname, 'migrations');

const getMigrationFiles = () => {
  return fs
    .readdirSync(MIGRATIONS_PATH)
    .filter((file) => file.endsWith('.js'))
    .sort();
};

const buildMigrationPlan = (executed, files) => {
  return files.filter((file) => !executed.has(file));
};

const markMigrationAsExecuted = async (sequelizeInstance, name, transaction) => {
  await sequelizeInstance.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name)', {
    replacements: { name },
    transaction,
  });
};

const runMigrations = async () => {
  const transaction = await sequelize.transaction();
  try {
    const executed = new Set();
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta"', { transaction });
    rows.forEach((row) => executed.add(row.name));

    const migrationFiles = getMigrationFiles();
    const pendingMigrations = buildMigrationPlan(executed, migrationFiles);

    for (const file of pendingMigrations) {
      const migration = require(path.join(MIGRATIONS_PATH, file));
      if (!migration.up || typeof migration.up !== 'function') {
        throw new Error(`Migration ${file} does not export an up function`);
      }
      console.log(`🔄 Running migration ${file}`);
      await migration.up(sequelize.getQueryInterface(), Sequelize, transaction);
      await markMigrationAsExecuted(sequelize, file, transaction);
      console.log(`✅ Migration applied: ${file}`);
    }

    await transaction.commit();
    console.log('✅ Migrations completed');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

module.exports = { runMigrations, getMigrationFiles, buildMigrationPlan };

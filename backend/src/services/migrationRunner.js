const { runMigrations, getMigrationFiles, buildMigrationPlan } = require('./migrationService');
const sequelize = require('../config/database');

const args = process.argv.slice(2);
const mode = args[0] || 'up';

const printUsage = () => {
  console.log('Usage: node src/services/migrationRunner.js [up|status]');
};

const run = async () => {
  if (mode === 'status') {
    const executed = new Set();
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    rows.forEach((row) => executed.add(row.name));
    const files = getMigrationFiles();
    const pending = buildMigrationPlan(executed, files);

    console.log(`Total migrations: ${files.length}`);
    console.log(`Executed: ${executed.size}`);
    console.log(`Pending: ${pending.length}`);
    if (pending.length > 0) {
      console.log('Pending migrations:');
      pending.forEach((file) => console.log(`- ${file}`));
    }
    return;
  }

  if (mode !== 'up') {
    printUsage();
    process.exit(1);
  }

  await runMigrations();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

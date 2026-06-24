const { runMigrations } = require('./migrationService');

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

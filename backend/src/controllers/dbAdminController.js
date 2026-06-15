const { sequelize } = require('../config/database');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.getDatabaseInfo = async (req, res) => {
  try {
    const [tables] = await sequelize.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('"' || tablename || '"')) as size,
        (SELECT reltuples::bigint FROM pg_class WHERE relname = tablename) as rows
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const [dbSize] = await sequelize.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as total_size
    `);

    const tablesWithIndexes = [];
    for (const table of tables) {
      const [indexes] = await sequelize.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = '${table.tablename}'
        ORDER BY indexname
      `);
      tablesWithIndexes.push({
        ...table,
        indexes
      });
    }

    res.json({
      tables: tablesWithIndexes,
      totalSize: dbSize[0].total_size,
      databaseName: process.env.DB_NAME || 'lunaroja'
    });
  } catch (error) {
    console.error('Error en getDatabaseInfo:', error);
    res.status(500).json({ message: 'Error al obtener información de la base de datos', error: error.message });
  }
};

exports.getTableIndexes = async (req, res) => {
  const { tableName } = req.params;
  try {
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = '${tableName}'
      ORDER BY indexname
    `);
    res.json(indexes);
  } catch (error) {
    console.error('Error en getTableIndexes:', error);
    res.status(500).json({ message: 'Error al obtener índices', error: error.message });
  }
};

exports.backup = async (req, res) => {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.sql`;
  const filePath = path.join(backupDir, filename);

  const command = `pg_dump -U ${process.env.DB_USER || 'lunaroja'} -d ${process.env.DB_NAME || 'lunaroja'} -h ${process.env.DB_HOST || 'postgres'} -f ${filePath}`;
  exec(command, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ message: 'Error al generar backup', error: stderr });
    }
    res.download(filePath, filename, (err) => {
      if (err) console.error(err);
      fs.unlinkSync(filePath);
    });
  });
};

exports.runMigrations = async (req, res) => {
  try {
    const umzug = require('../db/migrate');
    const pending = await umzug.pending();
    if (pending.length === 0) {
      return res.json({ message: 'No hay migraciones pendientes' });
    }
    await umzug.up();
    res.json({ message: `Migraciones aplicadas: ${pending.length}` });
  } catch (error) {
    console.error('Error en runMigrations:', error);
    res.status(500).json({ message: 'Error al ejecutar migraciones', error: error.message });
  }
};

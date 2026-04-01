const { sequelize } = require('../config/database');

// Obtener información general de la base de datos: tablas, filas, tamaño
exports.getDatabaseInfo = async (req, res) => {
  try {
    // Listar todas las tablas del esquema 'public'
    const [tables] = await sequelize.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('"' || tablename || '"')) as size,
        (SELECT reltuples::bigint FROM pg_class WHERE relname = tablename) as rows
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    // Obtener tamaño total de la base de datos
    const [dbSize] = await sequelize.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as total_size
    `);

    // Para cada tabla, obtener sus índices
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

// Obtener todos los índices de una tabla específica (opcional)
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

// Verificar índices duplicados en una tabla (o en todas)
exports.checkDuplicates = async (req, res) => {
  const { tableName = 'InstagramAccounts' } = req.query;
  try {
    const [results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = '${tableName}' 
        AND indexname LIKE '${tableName}_%_key%'
    `);
    // Asumimos que el índice original es el que no tiene sufijo numérico después del nombre de la columna.
    // Para simplificar, mostramos todos los que coinciden con el patrón.
    const duplicates = results.filter(idx => idx.indexname !== `${tableName}_username_key`);
    res.json({ 
      table: tableName,
      duplicates: duplicates.map(i => i.indexname), 
      count: duplicates.length,
      total: results.length,
      original: `${tableName}_username_key`
    });
  } catch (error) {
    console.error('Error en checkDuplicates:', error);
    res.status(500).json({ message: 'Error al verificar índices duplicados', error: error.message });
  }
};

// Limpiar índices duplicados en una tabla específica
exports.cleanDuplicates = async (req, res) => {
  const { tableName = 'InstagramAccounts' } = req.body;
  try {
    const [results] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = '${tableName}' 
        AND indexname LIKE '${tableName}_%_key%'
        AND indexname != '${tableName}_username_key'
    `);
    for (const idx of results) {
      await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}"`);
    }
    res.json({ 
      message: `Eliminados ${results.length} índices duplicados en la tabla ${tableName}.`,
      removed: results.map(i => i.indexname)
    });
  } catch (error) {
    console.error('Error en cleanDuplicates:', error);
    res.status(500).json({ message: 'Error al limpiar índices', error: error.message });
  }
};

// Backup (descarga del dump) - sin cambios
exports.backup = async (req, res) => {
  const { exec } = require('child_process');
  const path = require('path');
  const fs = require('fs');

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

// Migraciones (si usas umzug) - sin cambios
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
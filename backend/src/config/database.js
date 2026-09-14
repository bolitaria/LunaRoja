// backend/src/config/database.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: parseInt(process.env.PG_POOL_MAX, 10) || 10,
      min: parseInt(process.env.PG_POOL_MIN, 10) || 2,
      acquire: parseInt(process.env.PG_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.PG_POOL_IDLE, 10) || 10000,
      evict: parseInt(process.env.PG_POOL_EVICT, 10) || 1000,
    },
    define: {
      freezeTableName: false,
    },
    retry: {
      max: 3,
    },
  }
);

module.exports = sequelize;
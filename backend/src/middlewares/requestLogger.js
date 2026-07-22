const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');

// Asigna un ID único a cada petición
const assignId = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};

// Formato personalizado para morgan que incluye el ID
const logFormat = ':id :method :url :status :response-time ms';

// Configura morgan para usar nuestro formato y el req.id
morgan.token('id', (req) => req.id);
const requestLogger = morgan(logFormat);

module.exports = { assignId, requestLogger };
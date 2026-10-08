require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const pinoHttp = require('pino-http');
const db = require('./models');

const logger = require('./config/logger');
const { initEmailService } = require('./services/emailService');
const { initQueueService } = require('./services/queueService');
const { initSessionCache } = require('./services/sessionCacheService');
const { runMigrations } = require('./services/migrationService');
const { assignId, requestLogger } = require('./middlewares/requestLogger');
const { syncStaticTemplates } = require('./controllers/emailTemplateController');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const actionRoutes = require('./routes/actionRoutes');
const chatGroupRoutes = require('./routes/chatGroupRoutes');
const imageRoutes = require('./routes/imageRoutes');
const dbAdminRoutes = require('./routes/dbAdminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const documentRoutes = require('./routes/documentRoutes');
const bdsRoutes = require('./routes/bdsRoutes');
const petitionsRoutes = require('./routes/petitionsRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const linksRoutes = require('./routes/linksRoutes');
const healthRoutes = require('./routes/healthRoutes');
const colectivosAfinesRoutes = require('./routes/colectivosAfinesRoutes');

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Directorios de subida
const UPLOADS_BASE = '/app/uploads';
const SUB_DIRS = ['featured', 'images', 'documents', 'petitions', 'colectivos', 'campaigns', 'actions', 'bds'];

if (!fs.existsSync(UPLOADS_BASE)) fs.mkdirSync(UPLOADS_BASE, { recursive: true });
SUB_DIRS.forEach(dir => {
  const fullPath = path.join(UPLOADS_BASE, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});
logger.info({ base: UPLOADS_BASE }, '📁 Directorios de uploads asegurados');

// Seguridad
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://*.openstreetmap.org'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(hpp());
app.use(assignId);
app.use(requestLogger);
app.use(pinoHttp({ logger }));
app.use('/health', healthRoutes);

// CORS
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://host.docker.internal:3000',
  'http://lunaroja_frontend:3000',
];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : isProduction ? [] : defaultOrigins;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || !isProduction) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));

// Rate limiting
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_PUBLIC, 10) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones, inténtalo más tarde.',
  skip: (req) => process.env.NODE_ENV === 'test',
});
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_ADMIN, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones, inténtalo más tarde.',
  skip: (req) => process.env.NODE_ENV === 'test',
});
app.use('/api/admin', adminLimiter);
app.use('/api', publicLimiter);

// Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  const ext = path.extname(req.path).toLowerCase();
  const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
  if (allowedExt.includes(ext)) next();
  else res.status(403).json({ message: 'File type not allowed' });
}, express.static(UPLOADS_BASE, { dotfiles: 'deny', index: false, maxAge: '1d', redirect: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/chat-groups', chatGroupRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/database', dbAdminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/bds', bdsRoutes);
app.use('/api/petitions', petitionsRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/colectivosAfines', colectivosAfinesRoutes);

app.get('/api', (req, res) => res.json({ message: 'Welcome to Voces Palestinas por la Justicia API' }));

// ============================================================
// MÉTRICAS PROMETHEUS
// ============================================================
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Número total de aciertos de caché',
});
const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Número total de fallos de caché',
});
const queueSize = new client.Gauge({
  name: 'bullmq_queue_size',
  help: 'Tamaño actual de las colas BullMQ',
  labelNames: ['queue', 'state'],
});

// Exponer globalmente para el middleware de caché
global.__cacheMetrics = { cacheHits, cacheMisses };

// Actualizar gauges de cola cada 10s (solo en proceso API, no en worker)
if (process.env.WORKER_ONLY !== 'true') {
  setInterval(async () => {
    try {
      const { getQueueMetrics } = require('./services/queueService');
      const metrics = await getQueueMetrics();
      for (const q of metrics) {
        if (q.error) continue;
        queueSize.set({ queue: q.name, state: 'waiting' }, q.waiting || 0);
        queueSize.set({ queue: q.name, state: 'active' }, q.active || 0);
        queueSize.set({ queue: q.name, state: 'completed' }, q.completed || 0);
        queueSize.set({ queue: q.name, state: 'failed' }, q.failed || 0);
        queueSize.set({ queue: q.name, state: 'delayed' }, q.delayed || 0);
      }
    } catch (err) {
      // silencioso
    }
  }, 10000);
}

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  logger.error({ err, method: req.method, url: req.originalUrl, status }, 'Request error');
  if (res.headersSent) return next(err);
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

const ensureAdmin = async () => {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    let admin = await db.User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      await db.User.create({ username: 'admin', password: adminPassword, email: 'admin@example.com', role: 'superadmin' });
      logger.info('✅ Superadmin "admin" creado');
    } else {
      const match = await bcrypt.compare(adminPassword, admin.password);
      if (!match) {
        admin.password = adminPassword;
        await admin.save();
        logger.info('🔑 Contraseña de admin actualizada');
      } else {
        logger.info('✅ Superadmin ya existe y contraseña correcta.');
      }
    }
  } catch (err) {
    logger.error({ err }, '❌ Error al asegurar superadmin');
  }
};

const runInitialMigrations = async () => {
  try {
    await db.sequelize.query(`CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY);`);
    await runMigrations();
  } catch (err) {
    logger.error({ err }, '❌ Failed to run initial migrations');
    throw err;
  }
};

const ensureColectivosAfinesTable = async () => {
  try {
    const ColectivoAfines = require('./models/ColectivosAfines');
    await ColectivoAfines.sync({ alter: true });
    logger.info('✅ Tabla colectivos_afines sincronizada');
  } catch (err) {
    logger.error({ err }, '❌ Error al sincronizar tabla colectivos_afines');
  }
};

const ensureAdminAuditTable = async () => {
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "AdminAuditLogs" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        "username" VARCHAR(255),
        "role" VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        "entityType" VARCHAR(50) NOT NULL,
        "entityId" VARCHAR(100),
        metadata JSONB DEFAULT '{}'::jsonb,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_user ON "AdminAuditLogs" ("userId");
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON "AdminAuditLogs" ("entityType", "entityId");
      CREATE INDEX IF NOT EXISTS idx_audit_created ON "AdminAuditLogs" ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON "AdminAuditLogs" (action);
    `);
    logger.info('✅ Tabla AdminAuditLogs verificada');
  } catch (err) {
    logger.error({ err }, '❌ Error al verificar tabla AdminAuditLogs');
  }
};

const startServer = async () => {
  try {
    await initEmailService();
    await syncStaticTemplates();
    initQueueService();
    await initSessionCache().catch(err => logger.warn({ err }, 'Session cache unavailable'));
    await runInitialMigrations();

    if (process.env.NODE_ENV !== 'production') {
      await db.sequelize.sync();
      logger.info('✅ Database synchronized (dev mode)');
    } else {
      logger.info('⏩ Sincronización de BD omitida (producción)');
    }

    await ensureAdmin();
    await ensureColectivosAfinesTable();
    await ensureAdminAuditTable();

    require('./jobs/reminderJob');
    if (process.env.SKIP_EMAILS !== 'true' && process.env.NODE_ENV !== 'test') {
      require('./jobs/emailQueueJob');
    } else {
      logger.info('📧 Job de cola de correos omitido (SKIP_EMAILS=true o NODE_ENV=test)');
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info({ port: PORT }, '🚀 Server running');
    });
  } catch (err) {
    logger.error({ err }, '❌ Failed to start server');
    process.exit(1);
  }
};

if (process.env.WORKER_ONLY === 'true') {
  logger.info('👷 Modo worker: omitiendo arranque de API');
} else {
  startServer();
}

module.exports = app;
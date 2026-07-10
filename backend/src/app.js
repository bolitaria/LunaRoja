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
const db = require('./models');

const { initEmailService } = require('./services/emailService');
const { runMigrations } = require('./services/migrationService');

// --------------------- Routes ---------------------
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
const petitionsRoutes = require('./routes/petitions');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ---------- Configuración de directorios de subida ----------
const UPLOADS_BASE = '/app/uploads';
const SUB_DIRS = ['featured', 'images', 'documents', 'petitions'];

if (!fs.existsSync(UPLOADS_BASE)) {
  fs.mkdirSync(UPLOADS_BASE, { recursive: true });
}
SUB_DIRS.forEach(dir => {
  const fullPath = path.join(UPLOADS_BASE, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});
console.log('📁 Directorios de uploads asegurados en:', UPLOADS_BASE);

// ---------- Middleware de seguridad ----------
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(hpp());
app.use('/api/email-templates', emailTemplateRoutes);

// ---------- CORS ----------
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://host.docker.internal:3000',
  'http://lunaroja_frontend:3000',
];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));

// ---------- Rate limiting ----------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', apiLimiter);

// ---------- Parsers ----------
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));
app.use(cookieParser());

// ---------- Servir archivos estáticos desde /app/uploads ----------
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(UPLOADS_BASE, {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d',
  redirect: false,
}));

// ============ RUTAS ============
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

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Voces Palestinas por la Justicia API' });
});

// ---------- Middleware de manejo de errores (JSON) ----------
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error('Error:', err.message);
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
  });
});

// -----------------------------------------------------------

const PORT = process.env.PORT || 5000;

const ensureColumnsExist = async () => {
  try {
    await db.sequelize.query(`
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "refreshToken" VARCHAR(255);
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;
      ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Aseguradas columnas en Users');
  } catch (err) {
    console.error('❌ Error al asegurar columnas:', err);
    throw err;
  }
};

const ensureAdmin = async () => {
  try {
    const adminExists = await db.User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await db.User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'superadmin',
      });
      console.log('✅ Superadmin "admin" creado');
    } else {
      console.log('✅ Superadmin ya existe.');
    }
  } catch (err) {
    console.error('❌ Error al crear superadmin:', err);
    throw err;
  }
};

const runInitialMigrations = async () => {
  try {
    await db.sequelize.query(`CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY);`);
    await runMigrations();
  } catch (err) {
    console.error('❌ Failed to run initial migrations:', err);
    throw err;
  }
};

const startServer = async () => {
  try {
    await initEmailService();
    await runInitialMigrations();

    const syncOptions = isProduction ? {} : { alter: true };
    if (isProduction) {
      console.log('🔒 Production mode: using safe database sync');
    }

    await db.sequelize.sync({ force: true });
    console.log('✅ Database synchronized');

    await ensureColumnsExist();
    await ensureAdmin();

    // Iniciar scheduler de recordatorios
    require('./jobs/reminderJob');
    require('./jobs/emailQueueJob');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
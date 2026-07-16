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
const { initQueueService } = require('./services/queueService');
const { initSessionCache } = require('./services/sessionCacheService');
const { runMigrations } = require('./services/migrationService');
const { assignId, requestLogger } = require('./middlewares/requestLogger');

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
const petitionsRoutes = require('./routes/petitionsRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const linksRoutes = require('./routes/linksRoutes');
const healthRoutes = require('./routes/healthRoutes');

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ---------- Directorios de subida ----------
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
app.use(assignId);
app.use(requestLogger);
app.use('/health', healthRoutes);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.openstreetmap.org"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

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
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 50000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', apiLimiter);

// ---------- Parsers ----------
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));
app.use(cookieParser());

// ---------- Archivos estáticos (uploads) ----------
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
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/links', linksRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Voces Palestinas por la Justicia API' });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error('Error:', err.message);
  res.status(status).json({
    message: err.message || 'Error interno del servidor',
  });
});

// ==================== ARRANQUE ====================
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
    let admin = await db.User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await db.User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'superadmin',
      });
      console.log('✅ Superadmin "admin" creado');
    } else {
      const match = await bcrypt.compare('admin123', admin.password);
      if (!match) {
        admin.password = await bcrypt.hash('admin123', 12);
        await admin.save();
        console.log('🔑 Contraseña de admin actualizada');
      } else {
        console.log('✅ Superadmin ya existe y contraseña correcta.');
      }
    }
  } catch (err) {
    console.error('❌ Error al asegurar superadmin:', err);
    throw err;
  }
};

const ensureDefaultPetitionTemplate = async () => {
  try {
    const existing = await db.EmailTemplate.findOne({ where: { name: 'Petición oficial' } });
    if (!existing) {
      const templateBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin:0; padding:0; background-color: {{backgroundColor}}; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {{backgroundColor}};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: {{headerColor}}; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">{{subject}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 20px; color: #333333; line-height: 1.6;">
              {{{body}}}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 20px 30px; text-align: center;">
              <a href="{{actionLink}}" style="display: inline-block; background-color: {{buttonColor}}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">Firmar petición</a>
            </td>
          </tr>
          <tr>
            <td style="background-color: {{footerColor}}; padding: 20px; text-align: center; color: #ffffff; font-size: 12px;">
              <p style="margin: 0;">Voces Palestinas por la Justicia</p>
              <p style="margin: 5px 0 0;">
                <a href="{{unsubscribeLink}}" style="color: #ffffff; text-decoration: underline;">Cancelar suscripción</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      await db.EmailTemplate.create({
        name: 'Petición oficial',
        subject: 'Petición de justicia para Palestina',
        body: templateBody,
        type: 'system',
        associatedEvent: 'custom',
        isActive: true,
        headerColor: '#b91c1c',
        buttonColor: '#16a34a',
        footerColor: '#1f2937',
        backgroundColor: '#f3f4f6',
      });
      console.log('✅ Plantilla por defecto para peticiones creada');
    } else {
      console.log('✅ Plantilla por defecto ya existe');
    }
  } catch (err) {
    console.error('❌ Error al asegurar plantilla de peticiones:', err);
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
    await initQueueService().catch(err => console.warn('Queue service unavailable:', err.message));
    await initSessionCache().catch(err => console.warn('Session cache unavailable:', err.message));
    await runInitialMigrations();

    // ─── Sincronización condicional (solo si SKIP_DB_SYNC no está activa) ───
    if (process.env.SKIP_DB_SYNC !== 'true') {
      const syncOptions = isProduction ? { alter: true } : { alter: true };
      await db.sequelize.sync(syncOptions);
      console.log('✅ Database synchronized');
    } else {
      console.log('⏩ Sincronización de BD omitida (SKIP_DB_SYNC=true)');
    }

    await ensureColumnsExist();
    await ensureAdmin();
    await ensureDefaultPetitionTemplate();

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
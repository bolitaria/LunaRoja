const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

const { startProxyUpdater } = require('./services/proxyManager');

// Importar modelos
const Campaign = require('./models/Campaign');
const Action = require('./models/Action');
const ActionImage = require('./models/ActionImage');
const User = require('./models/User');
const Video = require('./models/Video');
const Report = require('./models/Report');
const Subscriber = require('./models/Subscriber');
const WorkingGroup = require('./models/WorkingGroup');
const InstagramAccount = require('./models/InstagramAccount');
const InstagramPost = require('./models/InstagramPost');
const UserCampaign = require('./models/UserCampaign');
const UserAction = require('./models/UserAction');

// Definir asociaciones
// Relaciones uno a muchos (campaña -> acciones)
Campaign.hasMany(Action, { foreignKey: 'campaignId', onDelete: 'SET NULL' });
Action.belongsTo(Campaign, { foreignKey: 'campaignId' });

// Relación acción -> imágenes múltiples
Action.hasMany(ActionImage, { foreignKey: 'actionId', as: 'images', onDelete: 'CASCADE' });
ActionImage.belongsTo(Action, { foreignKey: 'actionId', as: 'action' }); // ¡Importante el alias!

// Relaciones de Instagram
InstagramAccount.hasMany(InstagramPost, { foreignKey: 'accountId', onDelete: 'CASCADE' });
InstagramPost.belongsTo(InstagramAccount, { foreignKey: 'accountId', as: 'account' });

InstagramAccount.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Campaign.hasMany(InstagramAccount, { foreignKey: 'campaignId' });

// Relaciones muchos a muchos de usuarios con campañas y acciones
User.belongsToMany(Campaign, { through: UserCampaign, as: 'campaigns', foreignKey: 'userId' });
Campaign.belongsToMany(User, { through: UserCampaign, as: 'admins', foreignKey: 'campaignId' });

User.belongsToMany(Action, { through: UserAction, as: 'actions', foreignKey: 'userId' });
Action.belongsToMany(User, { through: UserAction, as: 'admins', foreignKey: 'actionId' });

// Relaciones para videos (si se vinculan a campañas/acciones)
Video.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Video.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');
const reportRoutes = require('./routes/reportRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const actionRoutes = require('./routes/actionRoutes');
const workingGroupRoutes = require('./routes/workingGroupRoutes');
const imageRoutes = require('./routes/imageRoutes');
const instagramRoutes = require('./routes/instagramRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/working-groups', workingGroupRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/instagram', instagramRoutes);
app.use(cors());
app.use('/uploads', cors(), express.static('uploads'));  // Servir archivos estáticos

app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenido a la API de LunaRoja' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }) // Cambia a true si necesitas sincronización automática
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
    startProxyUpdater();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });

if (process.env.NODE_ENV === 'production') {
  require('./workers/instagramWorker');
} else {
  console.log('Worker de Instagram desactivado en desarrollo. Ejecuta manualmente si lo necesitas.');
}
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');

const Campaign = require('./models/Campaign');
const Action = require('./models/Action');
const ActionImage = require('./models/ActionImage');
const User = require('./models/User');
const Noticia = require('./models/News');
const Report = require('./models/Report');
const Subscriber = require('./models/Subscriber');
const ChatGroup = require('./models/ChatGroup');
const UserCampaign = require('./models/UserCampaign');
const UserAction = require('./models/UserAction');
const Document = require('./models/Document');
const SubscribersReminder = require('./models/SubscribersReminder');

// Import email service
const { initEmailService } = require('./services/emailService');

// --------------------- Associations ---------------------
Campaign.hasMany(Action, { foreignKey: 'campaignId', onDelete: 'SET NULL' });
Action.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Action.hasMany(ActionImage, { foreignKey: 'actionId', as: 'images', onDelete: 'CASCADE' });
ActionImage.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });

Action.hasMany(ChatGroup, { foreignKey: 'actionId', as: 'chatGroups' });
ChatGroup.belongsTo(Action, { foreignKey: 'actionId', as: 'assignedAction' });  // alias único

User.belongsToMany(Campaign, { through: UserCampaign, as: 'campaigns', foreignKey: 'userId' });
Campaign.belongsToMany(User, { through: UserCampaign, as: 'admins', foreignKey: 'campaignId' });

User.belongsToMany(Action, { through: UserAction, as: 'actions', foreignKey: 'userId' });
Action.belongsToMany(User, { through: UserAction, as: 'admins', foreignKey: 'actionId' });

ChatGroup.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Campaign.hasMany(ChatGroup, { foreignKey: 'campaignId', as: 'campaignGroups' });

Noticia.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Noticia.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });
Campaign.hasMany(Noticia, { foreignKey: 'campaignId', as: 'noticias' });
Action.hasMany(Noticia, { foreignKey: 'actionId', as: 'noticias' });

Document.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
Document.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });
Campaign.hasMany(Document, { foreignKey: 'campaignId', as: 'documents' });
Action.hasMany(Document, { foreignKey: 'actionId', as: 'documents' });

Action.hasMany(SubscribersReminder, { foreignKey: 'actionId', as: 'reminders', onDelete: 'CASCADE' });
SubscribersReminder.belongsTo(Action, { foreignKey: 'actionId', as: 'action' });
Subscriber.hasMany(SubscribersReminder, { foreignKey: 'subscriberId', as: 'reminders', onDelete: 'CASCADE' });
SubscribersReminder.belongsTo(Subscriber, { foreignKey: 'subscriberId', as: 'subscriber' });

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

dotenv.config();

const app = express();

// CORS – allow frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/chats-groups', chatGroupRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/db-admin', dbAdminRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Voces Palestinas por la Justicia API' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initEmailService();   // Ensure email templates are loaded
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
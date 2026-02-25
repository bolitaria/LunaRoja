const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const reportRoutes = require('./routes/reportRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const actionRoutes = require('./routes/actionRoutes');
const eventRoutes = require('./routes/eventRoutes');
const workingGroupRoutes = require('./routes/workingGroupRoutes');


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/working-groups', workingGroupRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenido a la API de LunaRoja' });
});

// Conexión a la base de datos
const PORT = process.env.PORT || 5000;

sequelize.sync({ force: true })  // En desarrollo, alter:true actualiza tablas
  .then(() => {
    console.log('Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });

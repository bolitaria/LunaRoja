const express = require('express');
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin, canAccessCampaign } = require('../middlewares/authorize');
const uploadCampaign = require('../middlewares/uploadCampaign');
const router = express.Router();

// ✅ Verificación temporal (para depurar)
console.log('🔍 Verificando middlewares de campaña:');
console.log('  authMiddleware:', typeof authMiddleware);
console.log('  isSuperAdmin:', typeof isSuperAdmin);
console.log('  uploadCampaign:', typeof uploadCampaign);
console.log('  createCampaign:', typeof createCampaign);

// Rutas públicas con autenticación opcional
router.get('/', optionalAuth, getAllCampaigns);
router.get('/:id', optionalAuth, getCampaignById);

// Rutas protegidas
router.post('/', authMiddleware, isSuperAdmin, uploadCampaign, createCampaign);
router.put('/:id', authMiddleware, canAccessCampaign, uploadCampaign, updateCampaign);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteCampaign);

module.exports = router;
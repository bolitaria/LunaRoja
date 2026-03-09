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

// Rutas públicas con autenticación opcional (para filtrar según rol)
router.get('/', optionalAuth, getAllCampaigns);
router.get('/:id', optionalAuth, getCampaignById);

// Rutas protegidas (solo superadmin para crear y eliminar, con autorización para editar)
router.post('/', authMiddleware, isSuperAdmin, uploadCampaign, createCampaign);
router.put('/:id', authMiddleware, canAccessCampaign, uploadCampaign, updateCampaign);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteCampaign);

module.exports = router;
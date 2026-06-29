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

// 📌 Lectura: acceso público opcional, pero si hay token se usa para filtrar por rol
router.get('/', optionalAuth, getAllCampaigns);
router.get('/:id', optionalAuth, getCampaignById);

// 📌 Escritura: siempre requieren token y permisos específicos
router.post('/', authMiddleware, isSuperAdmin, uploadCampaign, createCampaign);
router.put('/:id', authMiddleware, canAccessCampaign, uploadCampaign, updateCampaign);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteCampaign);

module.exports = router;
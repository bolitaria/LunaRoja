const express = require('express');
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { authenticate: authMiddleware } = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin, canAccessCampaign } = require('../middlewares/authorize');
const cache = require('../middlewares/cache');
const uploadEntity = require('../middlewares/uploadEntity');

const router = express.Router();

router.get('/', optionalAuth, cache(60, 'campaigns'), getAllCampaigns);
router.get('/:id', optionalAuth, cache(60, 'campaigns'), getCampaignById);

router.post('/', authMiddleware, isSuperAdmin, uploadEntity, createCampaign);
router.put('/:id', authMiddleware, canAccessCampaign, uploadEntity, updateCampaign);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteCampaign);

module.exports = router;

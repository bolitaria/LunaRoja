const express = require('express');
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const authMiddleware = require('../middlewares/auth');
const uploadCampaign = require('../middlewares/uploadCampaign');
const router = express.Router();

router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);
router.post('/', authMiddleware, uploadCampaign, createCampaign);
router.put('/:id', authMiddleware, uploadCampaign, updateCampaign);
router.delete('/:id', authMiddleware, deleteCampaign);

module.exports = router;
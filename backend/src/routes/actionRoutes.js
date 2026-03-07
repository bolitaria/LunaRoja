const express = require('express');
const {
  getAllActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
  deleteActionImage,
} = require('../controllers/actionController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/uploadActions');
const router = express.Router();

router.get('/', getAllActions);
router.get('/:id', getActionById);
router.post('/', authMiddleware, upload, createAction);
router.put('/:id', authMiddleware, upload, updateAction);
router.delete('/:id', authMiddleware, deleteAction);
router.delete('/images/:imageId', authMiddleware, deleteActionImage);

module.exports = router;
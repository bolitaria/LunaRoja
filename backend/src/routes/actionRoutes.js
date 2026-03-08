const express = require('express');
const {
  getAllActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
  deleteActionImage
} = require('../controllers/actionController');
const authMiddleware = require('../middlewares/auth');
const uploadFields = require('../middlewares/uploadActions');
const router = express.Router();

router.get('/', getAllActions);
router.get('/:id', getActionById);
router.post('/', authMiddleware, uploadFields, createAction);
router.put('/:id', authMiddleware, uploadFields, updateAction);
router.delete('/:id', authMiddleware, deleteAction);
router.delete('/images/:imageId', authMiddleware, deleteActionImage);

module.exports = router;
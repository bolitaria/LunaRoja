const express = require('express');
const {
  getAllActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
} = require('../controllers/actionController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.get('/', getAllActions);
router.get('/:id', getActionById);
router.post('/', authMiddleware, createAction);
router.put('/:id', authMiddleware, updateAction);
router.delete('/:id', authMiddleware, deleteAction);

module.exports = router;
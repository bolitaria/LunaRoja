const express = require('express');
const {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} = require('../controllers/workingGroupController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.post('/', authMiddleware, createGroup);
router.put('/:id', authMiddleware, updateGroup);
router.delete('/:id', authMiddleware, deleteGroup);

module.exports = router;
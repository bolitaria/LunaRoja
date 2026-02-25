const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);

module.exports = router;
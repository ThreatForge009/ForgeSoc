const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats/summary', protect, ctrl.getEventStats);
router.get('/', protect, ctrl.getEvents);
router.get('/:id', protect, ctrl.getEventById);
router.post('/', protect, ctrl.createEvent);

module.exports = router;

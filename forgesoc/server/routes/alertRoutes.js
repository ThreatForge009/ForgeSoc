const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats/summary', protect, ctrl.getAlertStats);
router.get('/', protect, ctrl.getAlerts);
router.get('/:id', protect, ctrl.getAlertById);
router.patch('/:id/status', protect, ctrl.updateStatus);
router.patch('/:id/assign', protect, ctrl.assignAlert);
router.patch('/:id/verdict', protect, ctrl.setVerdict);
router.post('/:id/notes', protect, ctrl.addNote);

module.exports = router;

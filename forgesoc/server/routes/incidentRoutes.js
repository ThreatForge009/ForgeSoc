const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.getIncidents);
router.get('/:id', protect, ctrl.getIncidentById);
router.post('/', protect, ctrl.createIncident);
router.patch('/:id/status', protect, ctrl.updateStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, ctrl.getSummary);
router.get('/alerts.csv', protect, ctrl.exportAlertsCsv);
router.get('/events.csv', protect, ctrl.exportEventsCsv);

module.exports = router;

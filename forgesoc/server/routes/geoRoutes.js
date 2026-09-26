const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/geoController');
const { protect } = require('../middleware/authMiddleware');

router.get('/batch', protect, ctrl.batchLookup);
router.get('/:ip', protect, ctrl.lookup);

module.exports = router;

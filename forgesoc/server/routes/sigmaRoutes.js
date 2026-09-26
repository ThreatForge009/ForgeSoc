const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sigmaController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/import', protect, requireRole('ADMIN'), ctrl.importRules);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/blockController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.getBlocklist);
router.post('/', protect, requireRole('ADMIN', 'SOC_ANALYST'), ctrl.createBlock);
router.patch('/:id/unblock', protect, requireRole('ADMIN', 'SOC_ANALYST'), ctrl.removeBlock);

module.exports = router;

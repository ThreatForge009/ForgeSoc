const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ruleController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.getRules);
router.get('/:id', protect, ctrl.getRuleById);
router.post('/', protect, requireRole('ADMIN'), ctrl.createRule);
router.patch('/:id', protect, requireRole('ADMIN'), ctrl.updateRule);
router.patch('/:id/toggle', protect, requireRole('ADMIN', 'SOC_ANALYST'), ctrl.toggleRule);
router.delete('/:id', protect, requireRole('ADMIN'), ctrl.deleteRule);

module.exports = router;

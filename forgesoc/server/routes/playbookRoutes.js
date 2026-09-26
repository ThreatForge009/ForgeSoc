const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/playbookController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.getPlaybooks);
router.post('/', protect, requireRole('ADMIN'), ctrl.createPlaybook);
router.patch('/:id', protect, requireRole('ADMIN'), ctrl.updatePlaybook);
router.patch('/:id/toggle', protect, requireRole('ADMIN', 'SOC_ANALYST'), ctrl.toggle);
router.delete('/:id', protect, requireRole('ADMIN'), ctrl.deletePlaybook);

module.exports = router;

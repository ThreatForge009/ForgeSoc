const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assetController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.getAssets);
router.get('/:id', protect, ctrl.getAssetById);
router.post('/', protect, requireRole('ADMIN', 'SOC_ANALYST'), ctrl.createAsset);
router.patch('/:id', protect, requireRole('ADMIN', 'SOC_ANALYST'), ctrl.updateAsset);
router.delete('/:id', protect, requireRole('ADMIN'), ctrl.deleteAsset);

module.exports = router;

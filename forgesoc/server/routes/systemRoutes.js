const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/systemController');
const { protect } = require('../middleware/authMiddleware');

router.get('/status', protect, ctrl.getStatus);

module.exports = router;

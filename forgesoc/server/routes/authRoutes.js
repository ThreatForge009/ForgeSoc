const express = require('express');
const router = express.Router();
const { register, login, me, listAnalysts } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/analysts', protect, listAnalysts);

module.exports = router;

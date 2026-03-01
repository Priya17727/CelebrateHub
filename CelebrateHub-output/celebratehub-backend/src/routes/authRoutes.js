const express = require('express');
const router = express.Router();
const { sendOTP, register, login, selectRole, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOTP);
router.post('/register', register);
router.post('/login', login);
router.put('/select-role', protect, selectRole);
router.get('/me', protect, getMe);

module.exports = router;

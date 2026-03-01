const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  toggleWishlist,
  getWishlist,
  getVendorStats,
} = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/wishlist', protect, requireRole('user'), getWishlist);
router.put('/wishlist/:serviceId', protect, requireRole('user'), toggleWishlist);
router.get('/vendor/stats', protect, requireRole('vendor'), getVendorStats);

module.exports = router;

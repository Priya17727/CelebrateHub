const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  payBooking,
  rateBooking,
  getVendorRequests,
  respondToBooking,
} = require('../controllers/bookingController');
const { protect, requireRole } = require('../middleware/auth');

// IMPORTANT: specific routes BEFORE param routes (:id)
router.get('/my', protect, requireRole('user'), getMyBookings);
router.get('/vendor/requests', protect, requireRole('vendor'), getVendorRequests);

// User routes
router.post('/', protect, requireRole('user'), createBooking);
router.delete('/:id', protect, requireRole('user'), cancelBooking);
router.put('/:id/pay', protect, requireRole('user'), payBooking);
router.put('/:id/rate', protect, requireRole('user'), rateBooking);

// Vendor routes
router.put('/:id/respond', protect, requireRole('vendor'), respondToBooking);

module.exports = router;

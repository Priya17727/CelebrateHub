const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getMyServices,
} = require('../controllers/serviceController');
const { protect, requireRole } = require('../middleware/auth');

// IMPORTANT: specific routes BEFORE param routes (:id)
router.get('/vendor/mine', protect, requireRole('vendor'), getMyServices);

// Public
router.get('/', getServices);
router.get('/:id', getService);

// Vendor only
router.post('/', protect, requireRole('vendor'), createService);
router.put('/:id', protect, requireRole('vendor'), updateService);
router.delete('/:id', protect, requireRole('vendor'), deleteService);

module.exports = router;

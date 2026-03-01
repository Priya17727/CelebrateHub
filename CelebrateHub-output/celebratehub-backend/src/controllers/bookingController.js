const Booking = require('../models/Booking');
const Service = require('../models/Service');

// @desc  Create a booking (user)
// @route POST /api/bookings
// @access Private/User
const createBooking = async (req, res, next) => {
  try {
    const { serviceId, eventDate, eventType, guests, address, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      serviceId,
      vendorId: service.vendorId,
      eventDate,
      eventType,
      guests,
      address,
      notes,
    });

    await booking.populate([
      { path: 'serviceId', select: 'name category price location owner mobile' },
      { path: 'vendorId', select: 'username email' },
    ]);

    res.status(201).json({ success: true, message: 'Booking request sent!', data: booking });
  } catch (err) {
    next(err);
  }
};

// @desc  Get user's bookings
// @route GET /api/bookings/my
// @access Private/User
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('serviceId', 'name category price location owner mobile photos')
      .populate('vendorId', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, total: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

// @desc  Cancel / delete a booking (user)
// @route DELETE /api/bookings/:id
// @access Private/User
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (['paid', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a paid/completed booking.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Pay for a booking (user)
// @route PUT /api/bookings/:id/pay
// @access Private/User
const payBooking = async (req, res, next) => {
  try {
    const { method, transactionId } = req.body;

    const booking = await Booking.findById(req.params.id).populate('serviceId', 'price');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Booking must be accepted before payment.' });
    }

    booking.status = 'paid';
    booking.payment = {
      method: method || 'UPI',
      transactionId: transactionId || `TXN${Date.now()}`,
      paidAt: new Date(),
      amount: booking.serviceId?.price || 0,
    };

    await booking.save();
    res.json({ success: true, message: 'Payment successful!', data: booking });
  } catch (err) {
    next(err);
  }
};

// @desc  Rate a booking (user, after payment)
// @route PUT /api/bookings/:id/rate
// @access Private/User
const rateBooking = async (req, res, next) => {
  try {
    const { stars, review } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Stars must be between 1 and 5.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (!['paid', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Can only rate paid bookings.' });
    }

    if (booking.rating.stars) {
      return res.status(400).json({ success: false, message: 'Already rated.' });
    }

    booking.rating = { stars, review, ratedAt: new Date() };
    booking.status = 'completed';
    await booking.save();

    // Update service rating
    const service = await Service.findById(booking.serviceId);
    if (service) {
      service.updateRating(stars);
      await service.save();
    }

    res.json({ success: true, message: 'Rating submitted!', data: booking });
  } catch (err) {
    next(err);
  }
};

// -------- VENDOR BOOKING ROUTES --------

// @desc  Get vendor's booking requests
// @route GET /api/bookings/vendor/requests
// @access Private/Vendor
const getVendorRequests = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ vendorId: req.user._id })
      .populate('userId', 'username email mobile')
      .populate('serviceId', 'name category price location')
      .sort({ createdAt: -1 });

    res.json({ success: true, total: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

// @desc  Accept or reject a booking request (vendor)
// @route PUT /api/bookings/:id/respond
// @access Private/Vendor
const respondToBooking = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "accept" or "reject".' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking already responded to.' });
    }

    booking.status = action === 'accept' ? 'accepted' : 'rejected';
    await booking.save();

    res.json({
      success: true,
      message: `Booking ${booking.status}.`,
      data: { id: booking._id, status: booking.status },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  payBooking,
  rateBooking,
  getVendorRequests,
  respondToBooking,
};

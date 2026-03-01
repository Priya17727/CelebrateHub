const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

// @desc  Get user profile with recent bookings
// @route GET /api/users/profile
// @access Private
const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const recentBookings = await Booking.find({ userId: user._id })
      .populate('serviceId', 'name category price')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        wishlist: user.wishlist,
        createdAt: user.createdAt,
        recentBookings,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Update user profile
// @route PUT /api/users/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const { username, mobile } = req.body;
    const user = req.user;

    if (username) user.username = username;
    if (mobile) user.mobile = mobile;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated.',
      data: { username: user.username, mobile: user.mobile },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Toggle wishlist (add/remove)
// @route PUT /api/users/wishlist/:serviceId
// @access Private/User
const toggleWishlist = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const user = req.user;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const idx = user.wishlist.indexOf(serviceId);
    let action;
    if (idx === -1) {
      user.wishlist.push(serviceId);
      action = 'added';
    } else {
      user.wishlist.splice(idx, 1);
      action = 'removed';
    }
    await user.save();

    res.json({
      success: true,
      message: `Service ${action} ${action === 'added' ? 'to' : 'from'} wishlist.`,
      wishlisted: action === 'added',
      wishlist: user.wishlist,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get wishlist services
// @route GET /api/users/wishlist
// @access Private/User
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    const active = (user.wishlist || []).filter((s) => s.isActive);
    res.json({ success: true, total: active.length, data: active });
  } catch (err) {
    next(err);
  }
};

// @desc  Vendor dashboard stats
// @route GET /api/users/vendor/stats
// @access Private/Vendor
const getVendorStats = async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    const [services, pending, accepted, totalBookings] = await Promise.all([
      Service.countDocuments({ vendorId, isActive: true }),
      Booking.countDocuments({ vendorId, status: 'pending' }),
      Booking.countDocuments({ vendorId, status: 'accepted' }),
      Booking.countDocuments({ vendorId }),
    ]);

    res.json({
      success: true,
      data: { services, pending, accepted, totalBookings },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, toggleWishlist, getWishlist, getVendorStats };

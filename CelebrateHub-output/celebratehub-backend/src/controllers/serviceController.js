const Service = require('../models/Service');

// @desc  Get all services (with search & filter)
// @route GET /api/services
// @access Public
const getServices = async (req, res, next) => {
  try {
    const { search, category, priceRange, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    // Category filter
    if (category) query.category = category;

    // Price range filter
    if (priceRange === 'low') query.price = { $lt: 5000 };
    else if (priceRange === 'mid') query.price = { $gte: 5000, $lte: 20000 };
    else if (priceRange === 'high') query.price = { $gt: 20000 };

    // Search filter (name, location, owner)
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { location: regex }, { owner: regex }, { category: regex }];
    }

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate('vendorId', 'username email mobile')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: services,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single service
// @route GET /api/services/:id
// @access Public
const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'vendorId',
      'username email mobile'
    );
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

// @desc  Create a service (vendor only)
// @route POST /api/services
// @access Private/Vendor
const createService = async (req, res, next) => {
  try {
    const { name, category, location, price, owner, mobile, desc, invite, photos, additional } =
      req.body;

    const service = await Service.create({
      name,
      category,
      location,
      price,
      owner,
      mobile,
      desc,
      invite,
      photos: photos || [],
      additional,
      vendorId: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Service created successfully.', data: service });
  } catch (err) {
    next(err);
  }
};

// @desc  Update a service (owner vendor only)
// @route PUT /api/services/:id
// @access Private/Vendor
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    if (service.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this service.' });
    }

    const allowed = ['name', 'category', 'location', 'price', 'owner', 'mobile', 'desc', 'invite', 'photos', 'additional'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) service[field] = req.body[field];
    });

    await service.save();
    res.json({ success: true, message: 'Service updated.', data: service });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete (deactivate) a service
// @route DELETE /api/services/:id
// @access Private/Vendor
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    if (service.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    service.isActive = false;
    await service.save();

    res.json({ success: true, message: 'Service removed successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get vendor's own services
// @route GET /api/services/vendor/mine
// @access Private/Vendor
const getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ vendorId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, total: services.length, data: services });
  } catch (err) {
    next(err);
  }
};

module.exports = { getServices, getService, createService, updateService, deleteService, getMyServices };

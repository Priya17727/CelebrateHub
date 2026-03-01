const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Catering',
        'Photography',
        'Decoration',
        'Birthday Party',
        'Venue',
        'Makeup',
        'Music & DJ',
        'Entertainment',
        'Transport',
      ],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    owner: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    invite: {
      type: String,
      trim: true,
    },
    photos: [{ type: String }],
    additional: {
      type: String,
      trim: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: average rating recalculation helper
serviceSchema.methods.updateRating = function (newRating) {
  const totalScore = this.rating * this.ratingCount + newRating;
  this.ratingCount += 1;
  this.rating = +(totalScore / this.ratingCount).toFixed(1);
};

module.exports = mongoose.model('Service', serviceSchema);

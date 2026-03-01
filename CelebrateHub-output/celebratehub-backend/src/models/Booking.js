const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    eventType: {
      type: String,
      trim: true,
    },
    guests: {
      type: Number,
      min: 1,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'paid', 'completed', 'cancelled'],
      default: 'pending',
    },
    payment: {
      method: {
        type: String,
        enum: ['UPI', 'Card', 'Net Banking', 'Cash', null],
        default: null,
      },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
      amount: { type: Number, default: null },
    },
    rating: {
      stars: { type: Number, min: 1, max: 5, default: null },
      review: { type: String, default: null },
      ratedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);

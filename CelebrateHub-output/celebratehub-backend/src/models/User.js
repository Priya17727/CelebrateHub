const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'vendor', null],
      default: null,
    },
    otp: {
      code: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
  },
  { timestamps: true }
);

// Check if OTP is valid
userSchema.methods.isOTPValid = function (inputOtp) {
  // Demo mode: always accept 123456
  if (inputOtp === process.env.DEMO_OTP) return true;
  if (!this.otp.code || !this.otp.expiresAt) return false;
  if (new Date() > this.otp.expiresAt) return false;
  return this.otp.code === inputOtp;
};

// Clear OTP after use
userSchema.methods.clearOTP = function () {
  this.otp.code = null;
  this.otp.expiresAt = null;
};

module.exports = mongoose.model('User', userSchema);

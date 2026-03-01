const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();

// Generate a random 6-digit OTP
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Send OTP via Gmail SMTP
async function sendOTPEmail(toEmail, otp) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"CelebrateHub" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🎉 Your CelebrateHub OTP Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:36px;border-radius:16px;background:#fff3f8;border:1px solid #f9c6d9;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#e91e8c;margin:0;font-size:28px;">🎉 CelebrateHub</h1>
          <p style="color:#888;font-size:13px;margin-top:4px;">Making every celebration memorable</p>
        </div>
        <p style="color:#333;font-size:16px;margin-bottom:8px;">Hello!</p>
        <p style="color:#333;font-size:15px;">Your One-Time Password (OTP) for CelebrateHub verification is:</p>
        <div style="font-size:44px;font-weight:800;letter-spacing:14px;color:#e91e8c;text-align:center;margin:28px 0;padding:20px;background:#fff;border-radius:12px;border:2px dashed #f9c6d9;">
          ${otp}
        </div>
        <p style="color:#666;font-size:13px;text-align:center;">⏱ This OTP expires in <strong>10 minutes</strong></p>
        <p style="color:#999;font-size:12px;text-align:center;margin-top:8px;">Do not share this OTP with anyone. CelebrateHub will never ask for your OTP.</p>
        <hr style="border:none;border-top:1px solid #f9c6d9;margin:24px 0;">
        <p style="color:#bbb;font-size:11px;text-align:center;">If you didn't request this OTP, please ignore this email.</p>
      </div>
    `,
  });
}

// @desc  Send OTP to user's email
// @route POST /api/auth/send-otp
// @access Public
const sendOTP = async (req, res, next) => {
  try {
    const { email, mobile } = req.body;

    // For login: email is required
    // For register: we use the email field from regEmail, or email
    const targetEmail = email || req.body.regEmail;

    if (!targetEmail && !mobile) {
      return res.status(400).json({ success: false, message: 'Email is required to send OTP.' });
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your email address to receive the OTP.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Generate OTP and store it
    const otp = generateOTP();
    const key = targetEmail.toLowerCase();
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`[OTP] Generated OTP for ${key}: ${otp}`); // Server log only

    // Send real email
    try {
      await sendOTPEmail(targetEmail, otp);
      return res.json({
        success: true,
        message: `OTP sent to ${targetEmail}. Please check your inbox and spam folder.`,
      });
    } catch (mailErr) {
      console.error('[OTP] Email send failed:', mailErr.message);
      // Remove stored OTP since email failed
      otpStore.delete(key);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check server EMAIL configuration in .env and try again.',
        error: mailErr.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc  Register new user
// @route POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { username, email, mobile, otp } = req.body;

    if (!username || !email || !mobile || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Validate OTP from store (keyed by email)
    const key = email.toLowerCase();
    const stored = otpStore.get(key);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }
    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP valid — consume it
    otpStore.delete(key);

    const existing = await User.findOne({ email: key });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const user = await User.create({ username, email: key, mobile, isVerified: true });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Login with email + OTP
// @route POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    // Validate OTP from store
    const key = email.toLowerCase();
    const stored = otpStore.get(key);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP first.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }
    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP valid — consume it
    otpStore.delete(key);

    // Find or auto-create user
    let user = await User.findOne({ email: key });
    if (!user) {
      user = await User.create({
        username: email.split('@')[0],
        email: key,
        mobile: 'Not set',
        isVerified: true,
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Select role after login
// @route PUT /api/auth/select-role
// @access Private
const selectRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'vendor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be "user" or "vendor".' });
    }

    req.user.role = role;
    await req.user.save();

    res.json({
      success: true,
      message: `Role set to ${role}.`,
      data: { role: req.user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get current logged-in user
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  const user = req.user;
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
    },
  });
};

module.exports = { sendOTP, register, login, selectRole, getMe };

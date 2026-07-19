import express from 'express';
import { loginUser, getMe, googleAuth, githubAuth } from '../controllers/authController.js'; 
import { protect } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { sendOTPEmail } from '../utils/mailer.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const temporarySignupCache = new Map();

// Required here specifically for the OTP verification step
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- MULTI-STEP REGISTRATION ENDPOINTS ---

router.post('/register-step1', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Missing compulsory profile parameters.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'fail', message: 'An account is already linked to this email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 2 * 60 * 1000;

    temporarySignupCache.set(email, { name, password, otp, expiresAt });
    await sendOTPEmail(email, name, otp);

    return res.status(200).json({ status: 'success', message: 'Secure verification token dispatched to inbox.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = temporarySignupCache.get(email);
    if (!record) {
      return res.status(400).json({ status: 'fail', message: 'Registration session expired. Please sign up again.' });
    }

    if (Date.now() > record.expiresAt) {
      temporarySignupCache.delete(email);
      return res.status(400).json({ status: 'fail', message: 'Verification token expired.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ status: 'fail', message: 'Invalid verification token entry.' });
    }

    const user = await User.create({
      name: record.name,
      email: email,
      password: record.password,
    });

    temporarySignupCache.delete(email);

    return res.status(201).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// --- CORE FRAMEWORK ROUTES ---
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// --- ENTERPRISE OAUTH ROUTES ---
router.post('/google', googleAuth);
router.post('/github', githubAuth);

export default router;
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Initialize the Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper utility to generate standard signing tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Session valid for 7 calendar days
  });
};

/**
 * @desc    Authenticate existing user via Email/Password
 * @route   POST /api/auth/login
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide both email and password.' });
    }
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      return res.status(200).json({
        status: 'success',
        data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) },
      });
    } else {
      return res.status(401).json({ status: 'fail', message: 'Invalid email or password combination.' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({ status: 'success', data: req.user });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Authenticate via Google OAuth
 * @route   POST /api/auth/google
 */
export const googleAuth = async (req, res) => {
  const { access_token } = req.body;
  try {
    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    let user = await User.findOne({ email: profile.email });
    
    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        authProvider: 'google',
        avatar: profile.picture,
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) },
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res.status(401).json({ status: 'fail', message: 'Google authentication failed.' });
  }
};

/**
 * @desc    Authenticate via GitHub OAuth
 * @route   POST /api/auth/github
 */
export const githubAuth = async (req, res) => {
  const { code } = req.body;
  try {
    const { data: tokenData } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.body.code,
        redirect_uri: 'https://learnly-ai-mauve.vercel.app/auth/github/callback',
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error('GitHub authorization failed');

    const { data: profile } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data: emails } = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email;

    if (!primaryEmail) throw new Error('No verified email found in GitHub profile.');

    let user = await User.findOne({ email: primaryEmail });
    
    if (!user) {
      user = await User.create({
        name: profile.name || profile.login,
        email: primaryEmail,
        authProvider: 'github',
        avatar: profile.avatar_url,
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) },
    });
  } catch (error) {
    console.error('GitHub Auth Error:', error.message);
    return res.status(401).json({ status: 'fail', message: 'GitHub authentication failed.' });
  }
};

export const registerStep1 = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide name, email, and password.' });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ status: 'fail', message: 'User already exists and is verified.' });
    }

    // Generate a secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    // Create or update temporary unverified user record
    if (existingUser) {
      existingUser.name = name;
      existingUser.password = password; 
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password,
        otp,
        otpExpires,
        isVerified: false,
      });
    }

    // Dispatch the email using your transporter
    await sendOTPEmail(email, name, otp);
    
    return res.status(200).json({ status: 'success', message: "OTP sent successfully" });

  } catch (error) {
    console.error("🔥 REGISTER STEP 1 ERROR:", error.message);
    console.error(error.stack);
    
    return res.status(500).json({ 
      status: 'error',
      message: "Internal server error", 
      error: error.message 
    });
  }
};
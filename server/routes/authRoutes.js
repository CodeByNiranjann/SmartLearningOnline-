import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to generate JWT including user ID and session ID
const generateToken = (userId, sessionId) => {
  return jwt.sign(
    { id: userId, sessionId },
    process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// Helper to parse user agent for human-readable device name
const parseDevice = (userAgent = '') => {
  if (/mobile/i.test(userAgent)) return 'Mobile Device';
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Macintosh|Mac OS/i.test(userAgent)) return 'Macintosh';
  if (/Linux/i.test(userAgent)) return 'Linux Device';
  return 'Desktop Browser';
};

// Helper to create session in MongoDB
const createSession = async (userId, req) => {
  const sessionId = `sess_${crypto.randomUUID()}`;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const device = parseDevice(userAgent);
  
  // Expiration set to 7 days from creation
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    sessionId,
    userId,
    ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0] : '127.0.0.1',
    userAgent,
    device,
    isValid: true,
    expiresAt,
  });

  return session;
};

// @route   POST /api/auth/register
// @desc    Register new student & create session ID
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student',
    });

    // Create session record in MongoDB
    const session = await createSession(user._id, req);
    const token = generateToken(user._id, session.sessionId);

    res.status(201).json({
      token,
      sessionId: session.sessionId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & return session ID with JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create new session entry in MongoDB
    const session = await createSession(user._id, req);
    const token = generateToken(user._id, session.sessionId);

    res.json({
      token,
      sessionId: session.sessionId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        headline: user.headline || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout current user session
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Revoke current session in MongoDB
    await Session.updateOne({ sessionId: req.sessionId }, { isValid: false });

    res.json({ message: 'Logged out successfully', sessionId: req.sessionId });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   POST /api/auth/logout-all
// @desc    Revoke all active user sessions across all devices
// @access  Private
router.post('/logout-all', protect, async (req, res) => {
  try {
    await Session.updateMany({ userId: req.user._id }, { isValid: false });

    res.json({ message: 'All active sessions have been revoked' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Server error revoking sessions' });
  }
});

// @route   GET /api/auth/sessions
// @desc    List all active sessions for current user
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 });

    const formattedSessions = sessions.map((sess) => ({
      id: sess._id,
      sessionId: sess.sessionId,
      device: sess.device,
      ipAddress: sess.ipAddress,
      lastActiveAt: sess.lastActiveAt,
      createdAt: sess.createdAt,
      isCurrentSession: sess.sessionId === req.sessionId,
    }));

    res.json({
      currentSessionId: req.sessionId,
      activeSessions: formattedSessions,
    });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ message: 'Error retrieving active sessions' });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged-in user profile & session info
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user,
      currentSessionId: req.sessionId,
      sessionDevice: req.session?.device,
      lastActive: req.session?.lastActiveAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

export default router;

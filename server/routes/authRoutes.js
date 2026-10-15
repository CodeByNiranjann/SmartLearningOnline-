// Existing imports remain unchanged
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
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

// Role based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  };
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
// @desc    Authenticate user & return session ID with JWT token (or 2FA challenge)
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

    // Check if user has 2FA enabled
    if (user.isTwoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, type: '2fa_challenge' },
        process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026',
        { expiresIn: '10m' }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        email: user.email,
        name: user.name,
      });
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
        isTwoFactorEnabled: !!user.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/login-2fa
// @desc    Verify 2FA TOTP code or backup code to complete login
// @access  Public
router.post('/login-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Verification code and challenge token are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026'
      );
    } catch {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    if (decoded.type !== '2fa_challenge') {
      return res.status(401).json({ message: 'Invalid verification token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is not configured for this user' });
    }

    const sanitizedCode = code.toString().trim().replace(/[-\s]/g, '');

    // Check TOTP token
    const isTotpValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: sanitizedCode,
      window: 1,
    });

    let isBackupCodeValid = false;
    if (!isTotpValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const matchIndex = user.twoFactorBackupCodes.findIndex(
        (b) => !b.used && b.code.replace(/[-\s]/g, '').toLowerCase() === sanitizedCode.toLowerCase()
      );
      if (matchIndex !== -1) {
        user.twoFactorBackupCodes[matchIndex].used = true;
        await user.save();
        isBackupCodeValid = true;
      }
    }

    if (!isTotpValid && !isBackupCodeValid) {
      return res.status(400).json({ message: 'Invalid verification code or backup code' });
    }

    // Success - create session and token
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
        isTwoFactorEnabled: true,
      },
    });
  } catch (error) {
    console.error('2FA Login verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
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

// @route   PATCH /api/auth/me
// @desc    Update user's own profile (allowed fields: name, email, avatar, headline, bio)
// @access  Private
router.patch('/me', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'avatar', 'headline', 'bio'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    // If email is being updated, ensure uniqueness
    if (updates.email) {
      const existing = await User.findOne({ email: updates.email.toLowerCase(), _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      updates.email = updates.email.toLowerCase();
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// @route   PATCH /api/auth/users/:id/role
// @desc    Admin can change a user's role
// @access  Private (admin only)
router.patch('/users/:id/role', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.role = role;
    await user.save();
    res.json({ message: 'User role updated', user: { id: user._id, role: user.role } });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

export default router;


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
// @desc    Authenticate user & return session ID with JWT token (or 2FA challenge)
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

    // Check if user has 2FA enabled
    if (user.isTwoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, type: '2fa_challenge' },
        process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026',
        { expiresIn: '10m' }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        email: user.email,
        name: user.name,
      });
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
        isTwoFactorEnabled: !!user.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/login-2fa
// @desc    Verify 2FA TOTP code or backup code to complete login
// @access  Public
router.post('/login-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Verification code and challenge token are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026'
      );
    } catch {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    if (decoded.type !== '2fa_challenge') {
      return res.status(401).json({ message: 'Invalid verification token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is not configured for this user' });
    }

    const sanitizedCode = code.toString().trim().replace(/[-\s]/g, '');

    // Check TOTP token
    const isTotpValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: sanitizedCode,
      window: 1, // allow 30 seconds leeway
    });

    let isBackupCodeValid = false;
    if (!isTotpValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const matchIndex = user.twoFactorBackupCodes.findIndex(
        (b) => !b.used && b.code.replace(/[-\s]/g, '').toLowerCase() === sanitizedCode.toLowerCase()
      );
      if (matchIndex !== -1) {
        user.twoFactorBackupCodes[matchIndex].used = true;
        await user.save();
        isBackupCodeValid = true;
      }
    }

    if (!isTotpValid && !isBackupCodeValid) {
      return res.status(400).json({ message: 'Invalid verification code or backup code' });
    }

    // Success - create session and token
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
        isTwoFactorEnabled: true,
      },
    });
  } catch (error) {
    console.error('2FA Login verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
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

// @route   POST /api/auth/setup-2fa
// @desc    Generate 2FA secret and QR code for user to scan in Authenticator App
// @access  Private
router.post('/setup-2fa', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret = speakeasy.generateSecret({
      name: `LearnHub (${user.email})`,
      issuer: 'LearnHub',
      length: 20,
    });

    // Generate QR Code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ message: 'Failed to generate two-factor authentication setup' });
  }
});

// @route   POST /api/auth/enable-2fa
// @desc    Verify TOTP token against secret, enable 2FA, and generate backup codes
// @access  Private
router.post('/enable-2fa', protect, async (req, res) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ message: 'Secret and verification token are required' });
    }

    const isVerified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: token.toString().trim().replace(/[-\s]/g, ''),
      window: 1,
    });

    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Generate 8 random backup codes (8 characters each: XXXX-XXXX)
    const backupCodes = Array.from({ length: 8 }, () => {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      return `${part1}-${part2}`;
    });

    const user = await User.findById(req.user._id);
    user.isTwoFactorEnabled = true;
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes.map((code) => ({ code, used: false }));
    await user.save();

    res.json({
      message: 'Two-factor authentication successfully enabled',
      backupCodes,
      isTwoFactorEnabled: true,
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Failed to enable two-factor authentication' });
  }
});

// @route   POST /api/auth/disable-2fa
// @desc    Disable two-factor authentication for current user
// @access  Private
router.post('/disable-2fa', protect, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Require password confirmation to disable 2FA
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password. Cannot disable 2FA.' });
      }
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({
      message: 'Two-factor authentication disabled successfully',
      isTwoFactorEnabled: false,
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Failed to disable two-factor authentication' });
  }
});

// @route   GET /api/auth/backup-codes
// @desc    Get remaining backup codes count or status
// @access  Private
router.get('/backup-codes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const codes = user.twoFactorBackupCodes || [];
    const remainingCount = codes.filter((c) => !c.used).length;
    res.json({
      isTwoFactorEnabled: !!user.isTwoFactorEnabled,
      remainingBackupCodes: remainingCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking backup codes' });
  }
});

export default router;

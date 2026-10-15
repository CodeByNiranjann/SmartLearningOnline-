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

// Generate JWT with user ID and session ID
const generateToken = (userId, sessionId) => {
  return jwt.sign(
    { id: userId, sessionId },
    process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// Parse browser/device information
const parseDevice = (userAgent = '') => {
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/mobile/i.test(userAgent)) return 'Mobile Device';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Macintosh|Mac OS/i.test(userAgent)) return 'Macintosh';
  if (/Linux/i.test(userAgent)) return 'Linux Device';
  return 'Desktop Browser';
};

// Create a database session
const createSession = async (userId, req) => {
  const sessionId = `sess_${crypto.randomUUID()}`;
  const forwardedIp = req.headers['x-forwarded-for'];
  const ipAddress =
    (typeof forwardedIp === 'string' ? forwardedIp.split(',')[0].trim() : null) ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  return Session.create({
    sessionId,
    userId,
    ipAddress,
    userAgent,
    device: parseDevice(userAgent),
    isValid: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
};

// Role authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden: insufficient role',
      });
    }

    next();
  };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'student',
    });

    const session = await createSession(user._id, req);
    const token = generateToken(user._id, session.sessionId);

    return res.status(201).json({
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

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'An account with this email already exists',
      });
    }

    return res.status(500).json({
      message: 'Server error during registration',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please enter both email and password',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

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

    const session = await createSession(user._id, req);
    const token = generateToken(user._id, session.sessionId);

    return res.json({
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

    return res.status(500).json({
      message: 'Server error during login',
    });
  }
});

// POST /api/auth/login-2fa
router.post('/login-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        message: 'Verification code and challenge token are required',
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026'
      );
    } catch {
      return res.status(401).json({
        message: 'Session expired. Please sign in again.',
      });
    }

    if (decoded.type !== '2fa_challenge') {
      return res.status(401).json({
        message: 'Invalid verification token',
      });
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({
        message: 'Two-factor authentication is not configured for this user',
      });
    }

    const sanitizedCode = String(code).trim().replace(/[-\s]/g, '');

    const isTotpValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: sanitizedCode,
      window: 1,
    });

    let isBackupCodeValid = false;

    if (
      !isTotpValid &&
      user.twoFactorBackupCodes &&
      user.twoFactorBackupCodes.length > 0
    ) {
      const matchIndex = user.twoFactorBackupCodes.findIndex(
        (backupCode) =>
          !backupCode.used &&
          backupCode.code.replace(/[-\s]/g, '').toLowerCase() ===
            sanitizedCode.toLowerCase()
      );

      if (matchIndex !== -1) {
        user.twoFactorBackupCodes[matchIndex].used = true;
        await user.save();
        isBackupCodeValid = true;
      }
    }

    if (!isTotpValid && !isBackupCodeValid) {
      return res.status(400).json({
        message: 'Invalid verification code or backup code',
      });
    }

    const session = await createSession(user._id, req);
    const token = generateToken(user._id, session.sessionId);

    return res.json({
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
    console.error('2FA login error:', error);

    return res.status(500).json({
      message: 'Server error during 2FA verification',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    await Session.updateOne(
      { sessionId: req.sessionId },
      { isValid: false }
    );

    return res.json({
      message: 'Logged out successfully',
      sessionId: req.sessionId,
    });
  } catch (error) {
    console.error('Logout error:', error);

    return res.status(500).json({
      message: 'Server error during logout',
    });
  }
});

// POST /api/auth/logout-all
router.post('/logout-all', protect, async (req, res) => {
  try {
    await Session.updateMany(
      { userId: req.user._id },
      { isValid: false }
    );

    return res.json({
      message: 'All active sessions have been revoked',
    });
  } catch (error) {
    console.error('Logout all error:', error);

    return res.status(500).json({
      message: 'Server error revoking sessions',
    });
  }
});

// GET /api/auth/sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      isValid: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 });

    const activeSessions = sessions.map((session) => ({
      id: session._id,
      sessionId: session.sessionId,
      device: session.device,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      isCurrentSession: session.sessionId === req.sessionId,
    }));

    return res.json({
      currentSessionId: req.sessionId,
      activeSessions,
    });
  } catch (error) {
    console.error('Fetch sessions error:', error);

    return res.status(500).json({
      message: 'Error retrieving active sessions',
    });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    return res.json({
      user,
      currentSessionId: req.sessionId,
      sessionDevice: req.session?.device,
      lastActive: req.session?.lastActiveAt,
    });
  } catch (error) {
    console.error('Fetch profile error:', error);

    return res.status(500).json({
      message: 'Server error fetching user profile',
    });
  }
});

// PATCH /api/auth/me
router.patch('/me', protect, async (req, res) => {
  try {
    const allowedUpdates = [
      'name',
      'email',
      'avatar',
      'headline',
      'bio',
    ];

    const updates = {};

    for (const key of allowedUpdates) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update',
      });
    }

    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();

      const existing = await User.findOne({
        email: updates.email,
        _id: { $ne: req.user._id },
      });

      if (existing) {
        return res.status(400).json({
          message: 'Email already in use by another account',
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);

    return res.status(500).json({
      message: 'Error updating user profile',
    });
  }
});

// PATCH /api/auth/users/:id/role
router.patch(
  '/users/:id/role',
  protect,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { role } = req.body;
      const validRoles = ['student', 'instructor', 'admin'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message: 'Invalid role specified',
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      user.role = role;
      await user.save();

      return res.json({
        message: 'User role updated',
        user: {
          id: user._id,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Role update error:', error);

      return res.status(500).json({
        message: 'Error updating user role',
      });
    }
  }
);

// POST /api/auth/setup-2fa
router.post('/setup-2fa', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const secret = speakeasy.generateSecret({
      name: `LearnHub (${user.email})`,
      issuer: 'LearnHub',
      length: 20,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode,
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);

    return res.status(500).json({
      message: 'Failed to generate two-factor authentication setup',
    });
  }
});

// POST /api/auth/enable-2fa
router.post('/enable-2fa', protect, async (req, res) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({
        message: 'Secret and verification token are required',
      });
    }

    const isVerified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(token).trim().replace(/[-\s]/g, ''),
      window: 1,
    });

    if (!isVerified) {
      return res.status(400).json({
        message: 'Invalid verification code. Please try again.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const backupCodes = Array.from({ length: 8 }, () => {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();

      return `${part1}-${part2}`;
    });

    user.isTwoFactorEnabled = true;
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes.map((code) => ({
      code,
      used: false,
    }));

    await user.save();

    return res.json({
      message: 'Two-factor authentication successfully enabled',
      backupCodes,
      isTwoFactorEnabled: true,
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);

    return res.status(500).json({
      message: 'Failed to enable two-factor authentication',
    });
  }
});

// POST /api/auth/disable-2fa
router.post('/disable-2fa', protect, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Require the current password before disabling 2FA.
    if (!password) {
      return res.status(400).json({
        message: 'Password is required to disable two-factor authentication',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Incorrect password. Cannot disable 2FA.',
      });
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];

    await user.save();

    return res.json({
      message: 'Two-factor authentication disabled successfully',
      isTwoFactorEnabled: false,
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);

    return res.status(500).json({
      message: 'Failed to disable two-factor authentication',
    });
  }
});

// GET /api/auth/backup-codes
router.get('/backup-codes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const codes = user.twoFactorBackupCodes || [];
    const remainingCount = codes.filter((code) => !code.used).length;

    return res.json({
      isTwoFactorEnabled: !!user.isTwoFactorEnabled,
      remainingBackupCodes: remainingCount,
    });
  } catch (error) {
    console.error('Backup codes error:', error);

    return res.status(500).json({
      message: 'Error checking backup codes',
    });
  }
});

export default router;
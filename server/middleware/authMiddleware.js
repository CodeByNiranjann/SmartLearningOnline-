import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

export const protect = async (req, res, next) => {
  let token;
  let sessionId;

  // Extract token from Authorization header or custom header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'];
  }

  sessionId = req.headers['x-session-id'];

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token or session ID provided' });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026'
    );

    const activeSessionId = sessionId || decoded.sessionId;

    if (!activeSessionId) {
      return res.status(401).json({ message: 'Session ID missing from authentication token' });
    }

    if (sessionId && decoded.sessionId && sessionId !== decoded.sessionId) {
      return res.status(401).json({ message: 'Session ID mismatch between token and request header' });
    }

    // Verify session existence & validity in MongoDB
    const session = await Session.findOne({
      sessionId: activeSessionId,
      isValid: true,
    });

    if (!session) {
      return res.status(401).json({ message: 'Session expired or invalidated. Please login again.' });
    }

    // Ensure session belongs to decoded user
    if (session.userId.toString() !== decoded.id) {
      return res.status(401).json({ message: 'Session user mismatch' });
    }

    // Fetch user details
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User account not found' });
    }

    if (user.isActive === false || user.status === 'deactivated') {
      return res.status(401).json({ message: 'Account has been deactivated. Please contact an administrator.' });
    }

    // Asynchronously update last active time for session tracking
    Session.updateOne({ _id: session._id }, { lastActiveAt: new Date() }).exec().catch(() => {});

    req.user = user;
    req.sessionId = activeSessionId;
    req.session = session;

    return next();
  } catch (error) {
    console.error('Session/JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Session token invalid or expired' });
  }
};

export const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_slp_learning_jwt_key_2026'
    );
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // In optionalProtect, silently ignore token errors and treat as public guest
  }

  return next();
};

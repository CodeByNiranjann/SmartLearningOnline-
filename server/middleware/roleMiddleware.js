// roleMiddleware.js
// Restricts route access to users with the specified role(s).
// Must be used AFTER the protect middleware so req.user is available.

/**
 * requireRole(...allowedRoles)
 * Usage: router.post('/route', protect, requireRole('admin', 'instructor'), handler)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized. Please log in.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
};

/**
 * Ownership helper — checks if the current user is the course owner OR an admin.
 * @param {Object} course   - Mongoose course document (must have instructorId)
 * @param {Object} user     - req.user object (must have _id and role)
 * @returns {boolean}
 */
export const canManageCourse = (course, user) => {
  if (user.role === 'admin') return true;
  if (!course.instructorId) return false;
  return course.instructorId.toString() === user._id.toString();
};

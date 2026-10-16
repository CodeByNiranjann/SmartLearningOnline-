import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import AuditLog from '../models/AuditLog.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect all admin routes
router.use(protect, requireRole('admin'));

// @route   POST /api/admin/instructors
// @desc    Create a new instructor account (Admin only)
// @access  Private (Admin only)
router.post('/instructors', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const instructor = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'instructor',
    });

    res.status(201).json({
      message: `Instructor account "${instructor.name}" created successfully.`,
      instructor: {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role,
        createdAt: instructor.createdAt,
      },
    });
  } catch (error) {
    console.error('Create instructor error:', error);
    res.status(500).json({ message: 'Error creating instructor account' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard overview metrics from database
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalModules,
      totalLessons,
      totalEnrollments,
      recentCourses,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments({}),
      Module.countDocuments({}),
      Lesson.countDocuments({}),
      Progress.countDocuments({}),
      Course.find({}).sort({ createdAt: -1 }).limit(5).select('title instructor category status createdAt'),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    ]);

    // Build recent platform activities feed
    const activities = [];

    recentCourses.forEach((c) => {
      activities.push({
        id: `course_${c._id}`,
        type: 'course_created',
        title: `New Course Added: "${c.title}"`,
        subtitle: `By instructor ${c.instructor} in ${c.category}`,
        timestamp: c.createdAt,
      });
    });

    recentUsers.forEach((u) => {
      activities.push({
        id: `user_${u._id}`,
        type: 'user_registered',
        title: `New User Joined: ${u.name}`,
        subtitle: `Role: ${u.role} (${u.email})`,
        timestamp: u.createdAt,
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalModules,
      totalLessons,
      totalEnrollments,
      recentActivity: activities.slice(0, 8),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Error retrieving admin statistics' });
  }
});

// @route   GET /api/admin/users
// @route   GET /api/admin/users
// @desc    Get paginated users with role, status & search filtering
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        query.$or = [{ status: 'active' }, { status: { $exists: false }, isActive: { $ne: false } }];
      } else if (status === 'deactivated') {
        query.$or = [{ status: 'deactivated' }, { isActive: false }];
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
        ],
      });
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -twoFactorSecret -twoFactorBackupCodes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Augment with activity metadata (enrolled courses count, taught courses count)
    const augmentedUsers = await Promise.all(
      users.map(async (u) => {
        const enrolledCount = await Progress.countDocuments({ userId: u._id });
        const coursesTaught = u.role === 'instructor' || u.role === 'admin'
          ? await Course.countDocuments({ instructorId: u._id })
          : 0;

        return {
          ...u.toObject(),
          isActive: u.isActive !== false && u.status !== 'deactivated',
          status: u.status || (u.isActive === false ? 'deactivated' : 'active'),
          enrolledCount,
          coursesTaught,
        };
      })
    );

    res.json({
      users: augmentedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update user details, role, or active status with required reason & audit logging
// @access  Private (Admin only)
router.patch('/users/:id', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { name, email, role, status, isActive, reason } = req.body;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isSelf = req.user._id.toString() === targetUserId;

    // Determine intended status
    let nextStatus = user.status || 'active';
    let nextIsActive = user.isActive !== false;

    if (typeof status === 'string' && ['active', 'deactivated'].includes(status)) {
      nextStatus = status;
      nextIsActive = status === 'active';
    } else if (typeof isActive === 'boolean') {
      nextIsActive = isActive;
      nextStatus = isActive ? 'active' : 'deactivated';
    }

    const nextRole = role && ['student', 'instructor', 'admin'].includes(role) ? role : user.role;

    const statusChanged = nextStatus !== (user.status || 'active') || nextIsActive !== (user.isActive !== false);
    const roleChanged = nextRole !== user.role;

    // Self-action guards
    if (isSelf) {
      if (statusChanged && (!nextIsActive || nextStatus === 'deactivated')) {
        return res.status(400).json({ message: 'You cannot deactivate your own administrative account.' });
      }
      if (roleChanged && nextRole !== 'admin') {
        return res.status(400).json({ message: 'You cannot demote your own administrative role.' });
      }
    }

    // Last admin protection guard
    if (user.role === 'admin' && (roleChanged || statusChanged)) {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false },
        status: { $ne: 'deactivated' },
      });

      if (activeAdminCount <= 1) {
        if (roleChanged && nextRole !== 'admin') {
          return res.status(400).json({
            message: 'Action blocked: Cannot demote the last remaining active Administrator.',
          });
        }
        if (statusChanged && (!nextIsActive || nextStatus === 'deactivated')) {
          return res.status(400).json({
            message: 'Action blocked: Cannot deactivate the last remaining active Administrator.',
          });
        }
      }
    }

    // Mandatory reason for sensitive operations
    if (statusChanged || roleChanged) {
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        return res.status(400).json({
          message: 'A mandatory justification reason must be provided for status or role changes.',
        });
      }
    }

    // Snapshot before state (strictly sanitize passwords)
    const beforeState = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      isActive: user.isActive !== false,
    };

    // Apply updates
    if (name && typeof name === 'string' && name.trim()) user.name = name.trim();
    if (email && typeof email === 'string' && email.trim()) user.email = email.trim().toLowerCase();
    user.role = nextRole;
    user.status = nextStatus;
    user.isActive = nextIsActive;

    await user.save();

    // Snapshot after state
    const afterState = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    };

    // Determine audit action type
    let auditAction = 'USER_UPDATED';
    if (statusChanged && roleChanged) {
      auditAction = 'USER_ROLE_AND_STATUS_UPDATED';
    } else if (statusChanged) {
      auditAction = nextIsActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    } else if (roleChanged) {
      auditAction = 'USER_ROLE_UPDATED';
    }

    await logAuditEvent({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: auditAction,
      targetType: 'User',
      targetId: user._id,
      reason: reason ? reason.trim() : 'Administrative profile update',
      before: beforeState,
      after: afterState,
      req,
    });

    res.json({
      message: `User "${user.name}" updated successfully.`,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user: ' + error.message });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role (backward compatible wrapper with audit logging)
// @access  Private (Admin only)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role, reason } = req.body;
    const targetUserId = req.params.id;

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified. Must be student, instructor, or admin.' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user._id.toString() === targetUserId && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot demote the last remaining Administrator account.',
        });
      }
    }

    const beforeRole = user.role;
    user.role = role;
    await user.save();

    await logAuditEvent({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'USER_ROLE_UPDATED',
      targetType: 'User',
      targetId: user._id,
      reason: reason || 'Role updated via admin dashboard',
      before: { role: beforeRole },
      after: { role: user.role },
      req,
    });

    res.json({
      message: `User role successfully updated to ${role}.`,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// @route   GET /api/admin/audit-logs
// @desc    List append-only audit trail logs with filtering & server-side pagination
// @access  Private (Admin only)
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, actorEmail, targetType, search, startDate, endDate } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    let query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (actorEmail && actorEmail.trim()) {
      query.actorEmail = { $regex: actorEmail.trim(), $options: 'i' };
    }

    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { action: { $regex: term, $options: 'i' } },
        { actorEmail: { $regex: term, $options: 'i' } },
        { reason: { $regex: term, $options: 'i' } },
        { targetType: { $regex: term, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ message: 'Error retrieving audit logs: ' + error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user account
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({ message: 'You cannot delete your own administrative account.' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If deleting an instructor, also clean up progress on courses or reassign
    await Progress.deleteMany({ userId: targetUserId });
    await User.findByIdAndDelete(targetUserId);

    res.json({ message: `User "${user.name}" (${user.email}) has been deleted.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// @route   GET /api/admin/reports
// @desc    Platform-wide analytics and distribution reports
// @access  Private (Admin only)
router.get('/reports', async (req, res) => {
  try {
    const courses = await Course.find({});
    const totalUsers = await User.countDocuments({});
    const totalProgress = await Progress.find({});

    // Category distribution
    const categoryMap = {};
    courses.forEach((c) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    });

    // Difficulty distribution
    const difficultyMap = { Beginner: 0, Intermediate: 0, Advanced: 0 };
    courses.forEach((c) => {
      if (difficultyMap[c.difficulty] !== undefined) {
        difficultyMap[c.difficulty]++;
      }
    });

    // Completion metrics
    const completedProgress = totalProgress.filter((p) => p.progressPercentage === 100).length;
    const inProgressCount = totalProgress.filter((p) => p.progressPercentage > 0 && p.progressPercentage < 100).length;
    const notStartedCount = totalProgress.filter((p) => p.progressPercentage === 0).length;

    res.json({
      categoryBreakdown: Object.entries(categoryMap).map(([name, count]) => ({ name, count })),
      difficultyBreakdown: Object.entries(difficultyMap).map(([name, count]) => ({ name, count })),
      completionBreakdown: [
        { status: 'Completed', count: completedProgress },
        { status: 'In Progress', count: inProgressCount },
        { status: 'Not Started', count: notStartedCount },
      ],
      totalEnrollments: totalProgress.length,
      averageCompletionRate: totalProgress.length > 0
        ? Math.round(totalProgress.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / totalProgress.length)
        : 0,
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ message: 'Error retrieving platform reports' });
  }
});

export default router;

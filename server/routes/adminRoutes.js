import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
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
// @desc    Get all users with optional role & search filtering
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password -twoFactorSecret -twoFactorBackupCodes')
      .sort({ createdAt: -1 });

    // Augment with activity metadata (enrolled courses count, taught courses count)
    const augmentedUsers = await Promise.all(
      users.map(async (u) => {
        const enrolledCount = await Progress.countDocuments({ userId: u._id });
        const coursesTaught = u.role === 'instructor' || u.role === 'admin'
          ? await Course.countDocuments({ instructorId: u._id })
          : 0;

        return {
          ...u.toObject(),
          enrolledCount,
          coursesTaught,
        };
      })
    );

    res.json(augmentedUsers);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role (student, instructor, admin)
// @access  Private (Admin only)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified. Must be student, instructor, or admin.' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Security check: Prevent admin from demoting themselves if they are the only admin
    if (req.user._id.toString() === targetUserId && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot demote the last remaining Administrator account.',
        });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      message: `User role successfully updated to ${role}.`,
      user: {
        id: user._id,
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

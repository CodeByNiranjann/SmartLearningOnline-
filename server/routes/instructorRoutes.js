import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect all instructor routes (instructors or admins)
router.use(protect, requireRole('instructor', 'admin'));

// @route   GET /api/instructor/stats
// @desc    Get dashboard metrics for logged-in instructor
// @access  Private (Instructor or Admin)
router.get('/stats', async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Find all courses owned by this instructor
    const courses = await Course.find({ instructorId }).sort({ createdAt: -1 });
    const courseIds = courses.map((c) => c._id);

    // Get count of modules and lessons across instructor's courses
    const [modulesCount, lessonsCount, progressRecords] = await Promise.all([
      Module.countDocuments({ courseId: { $in: courseIds } }),
      Lesson.countDocuments({ courseId: { $in: courseIds } }),
      Progress.find({ courseId: { $in: courseIds } }).populate('userId', 'name email'),
    ]);

    // Unique enrolled students
    const uniqueStudentIds = new Set(
      progressRecords
        .filter((p) => p.userId)
        .map((p) => p.userId._id.toString())
    );

    // Build course metrics breakdown
    const courseMetrics = await Promise.all(
      courses.map(async (course) => {
        const modCount = await Module.countDocuments({ courseId: course._id });
        const lesCount = await Lesson.countDocuments({ courseId: course._id });
        const enrolledForCourse = progressRecords.filter(
          (p) => p.courseId.toString() === course._id.toString()
        );
        const completedCount = enrolledForCourse.filter((p) => p.progressPercentage === 100).length;
        const avgProgress = enrolledForCourse.length > 0
          ? Math.round(enrolledForCourse.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / enrolledForCourse.length)
          : 0;

        return {
          id: course._id,
          title: course.title,
          category: course.category,
          status: course.status,
          difficulty: course.difficulty,
          modulesCount: modCount,
          lessonsCount: lesCount,
          enrolledCount: enrolledForCourse.length,
          completedCount,
          avgProgress,
        };
      })
    );

    // Recent activity feed
    const recentActivity = progressRecords
      .slice(0, 10)
      .map((p) => ({
        id: `prog_${p._id}`,
        studentName: p.userId?.name || 'Student',
        studentEmail: p.userId?.email || '',
        courseTitle: courses.find((c) => c._id.toString() === p.courseId.toString())?.title || 'Course',
        progressPercentage: p.progressPercentage,
        updatedAt: p.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      myCoursesCount: courses.length,
      myModulesCount: modulesCount,
      myLessonsCount: lessonsCount,
      totalStudentsCount: uniqueStudentIds.size,
      totalEnrollments: progressRecords.length,
      courseMetrics,
      recentActivity: recentActivity.slice(0, 6),
    });
  } catch (error) {
    console.error('Instructor stats error:', error);
    res.status(500).json({ message: 'Error retrieving instructor statistics' });
  }
});

// @route   GET /api/instructor/students
// @desc    Get all students enrolled in courses taught by logged-in instructor
// @access  Private (Instructor or Admin)
router.get('/students', async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Courses taught by instructor
    const courses = await Course.find({ instructorId }).select('_id title category');
    const courseIds = courses.map((c) => c._id);

    // Progress records for instructor's courses
    const progressList = await Progress.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name email createdAt')
      .populate('courseId', 'title category thumbnail')
      .populate('currentLesson', 'title')
      .sort({ updatedAt: -1 });

    const studentList = progressList
      .filter((p) => p.userId)
      .map((p) => ({
        id: p._id,
        studentId: p.userId._id,
        name: p.userId.name,
        email: p.userId.email,
        courseId: p.courseId?._id,
        courseTitle: p.courseId?.title || 'Unknown Course',
        courseCategory: p.courseId?.category || '',
        currentLesson: p.currentLesson?.title || 'Not started',
        completedLessonsCount: p.completedLessons?.length || 0,
        progressPercentage: p.progressPercentage || 0,
        lastActive: p.updatedAt,
      }));

    res.json(studentList);
  } catch (error) {
    console.error('Instructor students error:', error);
    res.status(500).json({ message: 'Error retrieving enrolled students' });
  }
});

// @route   GET /api/instructor/reports
// @desc    Instructor-specific course analytics
// @access  Private (Instructor or Admin)
router.get('/reports', async (req, res) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructorId });
    const courseIds = courses.map((c) => c._id);

    const progressRecords = await Progress.find({ courseId: { $in: courseIds } });

    const completed = progressRecords.filter((p) => p.progressPercentage === 100).length;
    const inProgress = progressRecords.filter((p) => p.progressPercentage > 0 && p.progressPercentage < 100).length;
    const notStarted = progressRecords.filter((p) => p.progressPercentage === 0).length;

    res.json({
      totalCourses: courses.length,
      totalStudentsEnrolled: progressRecords.length,
      completionBreakdown: [
        { status: 'Completed', count: completed },
        { status: 'In Progress', count: inProgress },
        { status: 'Just Enrolled', count: notStarted },
      ],
      averageProgress: progressRecords.length > 0
        ? Math.round(progressRecords.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / progressRecords.length)
        : 0,
    });
  } catch (error) {
    console.error('Instructor reports error:', error);
    res.status(500).json({ message: 'Error retrieving instructor reports' });
  }
});

export default router;

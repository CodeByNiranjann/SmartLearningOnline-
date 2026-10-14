import express from 'express';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC READ ROUTES (unchanged, no auth required)
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/courses
// @desc    Get all courses with search/filtering and module count (unpublished hidden from learners)
// @access  Public
router.get('/', optionalProtect, async (req, res) => {
  try {
    const { search, category, difficulty, instructor_id, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    // Filter by instructor's own courses (used on instructor dashboard)
    if (instructor_id) {
      query.instructorId = instructor_id;
    }

    // ACCEPTANCE CRITERIA: "unpublished courses are hidden"
    // Public learners must ONLY see published courses.
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwnerInstructor =
      req.user &&
      req.user.role === 'instructor' &&
      instructor_id &&
      instructor_id === req.user._id.toString();

    if (status && status !== 'all' && (isAdmin || isOwnerInstructor)) {
      query.status = status;
    } else if (status === 'all' && (isAdmin || isOwnerInstructor)) {
      // allow all statuses
    } else if (instructor_id && isOwnerInstructor) {
      // instructor managing own courses: allow viewing drafts
    } else {
      // Public learners: strictly hide unpublished courses
      query.status = 'published';
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });

    // Attach module count and lesson count to each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const moduleCount = await Module.countDocuments({ courseId: course._id });
        const lessonCount = await Lesson.countDocuments({ courseId: course._id });
        return {
          ...course.toObject(),
          moduleCount,
          lessonCount,
        };
      })
    );

    res.json(coursesWithDetails);
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course details (unpublished hidden from public learners)
// @access  Public
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // ACCEPTANCE CRITERIA: "unpublished courses are hidden"
    if (course.status !== 'published') {
      const canViewUnpublished =
        req.user &&
        (req.user.role === 'admin' ||
          (req.user.role === 'instructor' &&
            course.instructorId &&
            course.instructorId.toString() === req.user._id.toString()));

      if (!canViewUnpublished) {
        return res.status(404).json({ message: 'Course is not published or unavailable.' });
      }
    }

    const moduleCount = await Module.countDocuments({ courseId: course._id });
    const lessonCount = await Lesson.countDocuments({ courseId: course._id });

    res.json({
      ...course.toObject(),
      moduleCount,
      lessonCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course details' });
  }
});

// @route   GET /api/courses/:courseId/modules
// @desc    Get structured learning path (modules & lessons) for a course
// @access  Public
router.get('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const modules = await Module.find({ courseId }).sort({ order: 1 });

    const structuredModules = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
        return {
          ...mod.toObject(),
          lessons,
        };
      })
    );

    res.json(structuredModules);
  } catch (error) {
    console.error('Fetch modules error:', error);
    res.status(500).json({ message: 'Error fetching course modules' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED CRUD ROUTES (instructor or admin only)
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private — instructor or admin
router.post('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, category, difficulty, duration, thumbnail, price, tags, status } = req.body;

    if (!title || !description || !category || !duration || !thumbnail) {
      return res.status(400).json({
        message: 'Title, description, category, duration, and thumbnail are required.',
      });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      difficulty: difficulty || 'Beginner',
      duration,
      thumbnail,
      price: price || 0,
      tags: tags || [],
      status: status || 'draft',
      // Set instructor name from the current user and link instructorId
      instructor: req.user.name,
      instructorId: req.user._id,
    });

    res.status(201).json({
      message: 'Course created successfully.',
      course,
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Error creating course.' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private — owner instructor or admin
router.put('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You are not authorized to modify this course.',
      });
    }

    const { title, description, category, difficulty, duration, thumbnail, price, tags, status } = req.body;

    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (category !== undefined) course.category = category.trim();
    if (difficulty !== undefined) course.difficulty = difficulty;
    if (duration !== undefined) course.duration = duration;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (price !== undefined) course.price = price;
    if (tags !== undefined) course.tags = tags;
    if (status !== undefined) course.status = status;

    await course.save();

    res.json({
      message: 'Course updated successfully.',
      course,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Error updating course.' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course and cascade-delete its modules and lessons
// @access  Private — owner instructor or admin
router.delete('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You are not authorized to delete this course.',
      });
    }

    const courseId = course._id;

    // Cascade delete all lessons and modules belonging to this course
    await Lesson.deleteMany({ courseId });
    await Module.deleteMany({ courseId });
    await Course.findByIdAndDelete(courseId);

    res.json({
      message: 'Course and all its modules and lessons have been deleted.',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Error deleting course.' });
  }
});

// @route   POST /api/courses/:courseId/modules
// @desc    Create a new module inside a course
// @access  Private — owner instructor or admin
router.post('/:courseId/modules', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate parent course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Module cannot be created because the selected course does not exist.',
      });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to manage this course.',
      });
    }

    const { title, description, order } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Module title is required.' });
    }

    // Auto-assign order if not provided
    let moduleOrder = order;
    if (!moduleOrder) {
      const lastModule = await Module.findOne({ courseId }).sort({ order: -1 });
      moduleOrder = lastModule ? lastModule.order + 1 : 1;
    }

    const module = await Module.create({
      courseId,
      title: title.trim(),
      description: description?.trim() || '',
      order: moduleOrder,
    });

    res.status(201).json({
      message: 'Module created successfully.',
      module,
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ message: 'Error creating module.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT COURSE ENROLLMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/courses/:id/enrollment-status
// @desc    Check whether logged-in user is enrolled in course
// @access  Private
router.get('/:id/enrollment-status', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const [enrollment, progress] = await Promise.all([
      Enrollment.findOne({ userId: req.user._id, courseId, status: { $ne: 'cancelled' } }),
      Progress.findOne({ userId: req.user._id, courseId }),
    ]);

    const isEnrolled = !!(enrollment || progress);

    res.json({
      isEnrolled,
      enrollment,
      progress,
    });
  } catch (error) {
    console.error('Fetch enrollment status error:', error);
    res.status(500).json({ message: 'Error checking enrollment status' });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll authenticated student in a published course (duplicate enrollment prevented)
// @access  Private
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // ACCEPTANCE CRITERIA: "unpublished courses are hidden"
    if (course.status !== 'published') {
      return res.status(400).json({ message: 'Cannot enroll in an unpublished course.' });
    }

    // ACCEPTANCE CRITERIA: "duplicate enrollment is prevented"
    const existingEnrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
      status: 'active',
    });
    const existingProgress = await Progress.findOne({
      userId: req.user._id,
      courseId,
    });

    if (existingEnrollment || existingProgress) {
      return res.status(400).json({
        message: 'You are already enrolled in this course. Duplicate enrollment is not allowed.',
        isEnrolled: true,
        enrollment: existingEnrollment,
        progress: existingProgress,
      });
    }

    // If cancelled or non-existent, create or reactivate
    let enrollment = await Enrollment.findOne({ userId: req.user._id, courseId });
    if (enrollment) {
      enrollment.status = 'active';
      enrollment.enrolledAt = new Date();
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        userId: req.user._id,
        courseId,
        status: 'active',
      });
    }

    // Ensure progress record exists
    let firstLesson = null;
    const modules = await Module.find({ courseId }).sort({ order: 1 });
    if (modules.length > 0) {
      firstLesson = await Lesson.findOne({ moduleId: modules[0]._id }).sort({ order: 1 });
    }

    const progress = await Progress.create({
      userId: req.user._id,
      courseId,
      completedLessons: [],
      currentLesson: firstLesson ? firstLesson._id : null,
      progressPercentage: 0,
    });

    res.status(201).json({
      message: `Successfully enrolled in "${course.title}"!`,
      isEnrolled: true,
      enrollment,
      progress,
    });
  } catch (error) {
    // MongoDB duplicate key error guard (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You are already enrolled in this course. Duplicate enrollment is prevented.',
        isEnrolled: true,
      });
    }
    console.error('Enroll course error:', error);
    res.status(500).json({ message: 'Error enrolling in course.' });
  }
});

// @route   DELETE /api/courses/:id/enroll
// @desc    Unenroll / drop course
// @access  Private
router.delete('/:id/enroll', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    await Enrollment.deleteOne({ userId: req.user._id, courseId });
    await Progress.deleteOne({ userId: req.user._id, courseId });

    res.json({ message: 'Successfully dropped course enrollment.' });
  } catch (error) {
    console.error('Unenroll course error:', error);
    res.status(500).json({ message: 'Error dropping course enrollment.' });
  }
});

export default router;

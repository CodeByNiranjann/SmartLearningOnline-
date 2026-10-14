import express from 'express';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC READ ROUTE
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/modules/:moduleId/lessons
// @desc    Get lessons for a specific module
// @access  Public
router.get('/:moduleId/lessons', async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    const lessons = await Lesson.find({ moduleId: req.params.moduleId }).sort({ order: 1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lessons for module' });
  }
});

// @route   GET /api/modules/:id
// @desc    Get a single module by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED CRUD ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/modules
// @desc    Get modules across courses (admin: all, instructor: own courses)
// @access  Private — instructor or admin
router.get('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    let courseFilter = {};
    if (req.user.role === 'instructor') {
      const myCourses = await Course.find({ instructorId: req.user._id }).select('_id');
      courseFilter = { courseId: { $in: myCourses.map((c) => c._id) } };
    }

    const modules = await Module.find(courseFilter)
      .populate('courseId', 'title instructor category')
      .sort({ createdAt: -1 });

    const modulesWithLessonCount = await Promise.all(
      modules.map(async (m) => {
        const lessonCount = await Lesson.countDocuments({ moduleId: m._id });
        return {
          ...m.toObject(),
          lessonCount,
        };
      })
    );

    res.json(modulesWithLessonCount);
  } catch (error) {
    console.error('Fetch all modules error:', error);
    res.status(500).json({ message: 'Error fetching modules' });
  }
});

// @route   PUT /api/modules/:id
// @desc    Update a module
// @access  Private — owner instructor or admin
router.put('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    // Verify parent course exists
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Parent course for this module does not exist.' });
    }

    // Ownership check via parent course
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to manage this module.',
      });
    }

    // If courseId is being changed, validate that new course exists and user can manage it
    if (req.body.courseId && req.body.courseId !== module.courseId.toString()) {
      const newCourse = await Course.findById(req.body.courseId);
      if (!newCourse) {
        return res.status(404).json({
          message: 'Module cannot be moved because the target course does not exist.',
        });
      }
      if (!canManageCourse(newCourse, req.user)) {
        return res.status(403).json({
          message: 'You cannot move this module to a course you do not own.',
        });
      }
      module.courseId = req.body.courseId;
    }

    const { title, description, order } = req.body;

    if (title !== undefined) module.title = title.trim();
    if (description !== undefined) module.description = description.trim();
    if (order !== undefined) module.order = order;

    await module.save();

    res.json({
      message: 'Module updated successfully.',
      module,
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ message: 'Error updating module.' });
  }
});

// @route   DELETE /api/modules/:id
// @desc    Delete a module and cascade-delete its lessons
// @access  Private — owner instructor or admin
router.delete('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    // Verify parent course exists
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Parent course for this module does not exist.' });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to delete this module.',
      });
    }

    // Cascade delete lessons belonging to this module
    await Lesson.deleteMany({ moduleId: module._id });
    await Module.findByIdAndDelete(module._id);

    res.json({ message: 'Module and all its lessons have been deleted.' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ message: 'Error deleting module.' });
  }
});

// @route   POST /api/modules/:moduleId/lessons
// @desc    Create a lesson inside a module
// @access  Private — owner instructor or admin
router.post('/:moduleId/lessons', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Validate parent module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        message: 'Lesson cannot be created because the selected module does not exist.',
      });
    }

    // Validate parent course exists
    const course = await Course.findById(module.courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Lesson cannot be created because the parent course does not exist.',
      });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to manage this module.',
      });
    }

    const { title, description, content, order } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Lesson title is required.' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Lesson content is required.' });
    }

    // Auto-assign order if not provided
    let lessonOrder = order;
    if (!lessonOrder) {
      const lastLesson = await Lesson.findOne({ moduleId }).sort({ order: -1 });
      lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      moduleId,
      courseId: module.courseId,
      title: title.trim(),
      description: description?.trim() || '',
      content: content.trim(),
      order: lessonOrder,
    });

    res.status(201).json({
      message: 'Lesson created successfully.',
      lesson,
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ message: 'Error creating lesson.' });
  }
});

export default router;

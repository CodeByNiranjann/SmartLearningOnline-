import express from 'express';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Resource from '../models/Resource.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC READ ROUTES (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/lessons/:lessonId
// @desc    Get single lesson with previous/next lesson details for navigation
// @access  Public
router.get('/:lessonId', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // Get all lessons in the course ordered by module order and lesson order
    const allModules = await Module.find({ courseId: lesson.courseId }).sort({ order: 1 });
    let courseLessons = [];
    for (const mod of allModules) {
      const modLessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
      courseLessons = courseLessons.concat(modLessons);
    }

    const currentIndex = courseLessons.findIndex((l) => l._id.toString() === lesson._id.toString());
    const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

    res.json({
      lesson,
      prevLessonId: prevLesson ? prevLesson._id : null,
      nextLessonId: nextLesson ? nextLesson._id : null,
      totalCourseLessons: courseLessons.length,
      currentLessonIndex: currentIndex + 1,
    });
  } catch (error) {
    console.error('Fetch lesson error:', error);
    res.status(500).json({ message: 'Error fetching lesson content' });
  }
});

// @route   GET /api/lessons/:lessonId/resources
// @desc    Get resources for a specific lesson
// @access  Public
router.get('/:lessonId/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ lessonId: req.params.lessonId });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources for lesson' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED CRUD ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/lessons
// @desc    Get lessons across modules/courses (admin: all, instructor: own courses)
// @access  Private — instructor or admin
router.get('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'instructor') {
      const myCourses = await Course.find({ instructorId: req.user._id }).select('_id');
      filter = { courseId: { $in: myCourses.map((c) => c._id) } };
    }

    const lessons = await Lesson.find(filter)
      .populate('courseId', 'title instructor category')
      .populate('moduleId', 'title order')
      .sort({ createdAt: -1 });

    res.json(lessons);
  } catch (error) {
    console.error('Fetch all lessons error:', error);
    res.status(500).json({ message: 'Error fetching lessons' });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update a lesson
// @access  Private — owner instructor or admin
router.put('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // Validate parent module exists
    const parentModule = await Module.findById(lesson.moduleId);
    if (!parentModule) {
      return res.status(404).json({ message: 'Parent module for this lesson does not exist.' });
    }

    // Validate parent course exists
    const course = await Course.findById(parentModule.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Parent course for this lesson does not exist.' });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to manage this lesson.',
      });
    }

    // If moduleId is being changed, validate new module exists and user can manage it
    if (req.body.moduleId && req.body.moduleId !== lesson.moduleId.toString()) {
      const newModule = await Module.findById(req.body.moduleId);
      if (!newModule) {
        return res.status(404).json({
          message: 'Lesson cannot be moved because the target module does not exist.',
        });
      }
      // Verify the new module's course is one the user can manage
      const newCourse = await Course.findById(newModule.courseId);
      if (!newCourse || !canManageCourse(newCourse, req.user)) {
        return res.status(403).json({
          message: 'You cannot move this lesson to a module you do not have permission to manage.',
        });
      }
      lesson.moduleId = req.body.moduleId;
      lesson.courseId = newModule.courseId;
    }

    const { title, description, content, order } = req.body;

    if (title !== undefined) lesson.title = title.trim();
    if (description !== undefined) lesson.description = description.trim();
    if (content !== undefined) lesson.content = content.trim();
    if (order !== undefined) lesson.order = order;

    await lesson.save();

    res.json({
      message: 'Lesson updated successfully.',
      lesson,
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ message: 'Error updating lesson.' });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete a lesson
// @access  Private — owner instructor or admin
router.delete('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // Validate parent module
    const parentModule = await Module.findById(lesson.moduleId);
    if (!parentModule) {
      return res.status(404).json({ message: 'Parent module for this lesson does not exist.' });
    }

    // Validate parent course
    const course = await Course.findById(parentModule.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Parent course for this lesson does not exist.' });
    }

    // Ownership check
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to delete this lesson.',
      });
    }

    await Lesson.findByIdAndDelete(lesson._id);

    res.json({ message: 'Lesson deleted successfully.' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ message: 'Error deleting lesson.' });
  }
});

export default router;

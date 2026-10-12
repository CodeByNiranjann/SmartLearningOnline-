import express from 'express';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses with search/filtering and module count
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, difficulty } = req.query;
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

    const courses = await Course.find(query).sort({ createdAt: -1 });

    // Attach module count to each course
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
// @desc    Get single course details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
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

export default router;

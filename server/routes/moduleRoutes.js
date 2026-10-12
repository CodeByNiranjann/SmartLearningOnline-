import express from 'express';
import Lesson from '../models/Lesson.js';

const router = express.Router();

// @route   GET /api/modules/:moduleId/lessons
// @desc    Get lessons for a specific module
// @access  Public
router.get('/:moduleId/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find({ moduleId: req.params.moduleId }).sort({ order: 1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lessons for module' });
  }
});

export default router;

import express from 'express';
import Lesson from '../models/Lesson.js';
import Resource from '../models/Resource.js';
import Module from '../models/Module.js';

const router = express.Router();

// @route   GET /api/lessons/:lessonId
// @desc    Get single lesson with previous/next lesson details for navigation
// @access  Public
router.get('/:lessonId', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
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

export default router;

import express from 'express';
import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/progress
// @desc    Get student's overall progress across all enrolled courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const progressList = await Progress.find({ userId: req.user._id })
      .populate('courseId')
      .populate('currentLesson');

    const totalCoursesStarted = progressList.length;
    const totalCoursesCompleted = progressList.filter((p) => p.progressPercentage === 100).length;
    const totalLessonsCompleted = progressList.reduce((acc, p) => acc + (p.completedLessons ? p.completedLessons.length : 0), 0);
    const overallProgress = totalCoursesStarted > 0
      ? Math.round(progressList.reduce((acc, p) => acc + p.progressPercentage, 0) / totalCoursesStarted)
      : 0;

    res.json({
      summary: {
        coursesStarted: totalCoursesStarted,
        coursesCompleted: totalCoursesCompleted,
        lessonsCompleted: totalLessonsCompleted,
        overallProgress,
      },
      progressList,
    });
  } catch (error) {
    console.error('Fetch progress error:', error);
    res.status(500).json({ message: 'Error fetching student progress' });
  }
});

// @route   GET /api/progress/:courseId
// @desc    Get progress for a specific course
// @access  Private
router.get('/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    let progress = await Progress.findOne({ userId: req.user._id, courseId });

    if (!progress) {
      // Return empty default state if student hasn't started yet
      return res.json({
        userId: req.user._id,
        courseId,
        completedLessons: [],
        currentLesson: null,
        progressPercentage: 0,
      });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course progress' });
  }
});

// @route   POST /api/progress/complete-lesson
// @desc    Mark a lesson as complete and update student progress
// @access  Private
router.post('/complete-lesson', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId and lessonId are required' });
    }

    // Get all lessons for the course to calculate total count and find next lesson
    const modules = await Module.find({ courseId }).sort({ order: 1 });
    let allLessons = [];
    for (const mod of modules) {
      const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
      allLessons = allLessons.concat(lessons);
    }

    const totalLessonsCount = allLessons.length;
    if (totalLessonsCount === 0) {
      return res.status(400).json({ message: 'No lessons found in this course' });
    }

    let progress = await Progress.findOne({ userId: req.user._id, courseId });

    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        courseId,
        completedLessons: [lessonId],
        currentLesson: lessonId,
        progressPercentage: 0,
      });
    } else {
      if (!progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
      progress.currentLesson = lessonId;
    }

    // Calculate progress percentage
    const completedCount = progress.completedLessons.length;
    progress.progressPercentage = Math.min(100, Math.round((completedCount / totalLessonsCount) * 100));
    progress.updatedAt = Date.now();

    // Determine next lesson if available
    const currentIndex = allLessons.findIndex((l) => l._id.toString() === lessonId.toString());
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    await progress.save();

    res.json({
      message: 'Lesson marked as complete',
      progress,
      nextLessonId: nextLesson ? nextLesson._id : null,
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

export default router;

import express from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import LessonProgress from '../models/LessonProgress.js';
import LearningActivity from '../models/LearningActivity.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Helper: Record or update daily study activity for learning calendar
 */
async function recordDailyActivity(userId, { minutes = 0, lessonsCompleted = 0, courseId = null }) {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    let activity = await LearningActivity.findOne({ userId, date: dateStr });
    if (!activity) {
      activity = new LearningActivity({
        userId,
        date: dateStr,
        durationMinutes: 0,
        lessonsCompleted: 0,
        coursesStudied: [],
        lastActiveAt: new Date(),
      });
    }

    if (minutes > 0) {
      activity.durationMinutes += minutes;
    }
    if (lessonsCompleted > 0) {
      activity.lessonsCompleted += lessonsCompleted;
    }
    if (courseId && !activity.coursesStudied.some((c) => c.toString() === courseId.toString())) {
      activity.coursesStudied.push(courseId);
    }
    activity.lastActiveAt = new Date();
    await activity.save();
    return activity;
  } catch (err) {
    console.error('Error logging daily activity:', err);
    return null;
  }
}

/**
 * Helper: Fetch all lessons in course order (module order then lesson order)
 */
async function getCourseLessonsInOrder(courseId) {
  const modules = await Module.find({ courseId }).sort({ order: 1 });
  let allLessons = [];
  for (const mod of modules) {
    const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
    allLessons = allLessons.concat(lessons);
  }
  return allLessons;
}

/**
 * Helper: Sync course-level Progress document and Enrollment completion
 */
async function syncCourseProgress({ userId, courseId, lessonId, isComplete, playedSeconds = 0, durationSeconds = 0 }) {
  try {
    const allLessons = await getCourseLessonsInOrder(courseId);
    const totalCount = allLessons.length;

    let courseProgress = await Progress.findOne({ userId, courseId });
    if (!courseProgress) {
      courseProgress = new Progress({
        userId,
        courseId,
        completedLessons: [],
        currentLesson: lessonId,
        lastAccessedLesson: lessonId,
        playbackProgress: [],
        progressPercentage: 0,
        lastAccessedAt: Date.now(),
      });
    }

    courseProgress.lastAccessedLesson = lessonId;
    courseProgress.currentLesson = lessonId;
    courseProgress.lastAccessedAt = Date.now();
    courseProgress.updatedAt = Date.now();

    // Sync completedLessons
    if (isComplete) {
      if (!courseProgress.completedLessons.some((id) => id.toString() === lessonId.toString())) {
        courseProgress.completedLessons.push(lessonId);
      }
    }

    // Sync playbackProgress entry
    if (!courseProgress.playbackProgress) courseProgress.playbackProgress = [];
    const pbIdx = courseProgress.playbackProgress.findIndex(
      (p) => p.lessonId.toString() === lessonId.toString()
    );
    if (pbIdx >= 0) {
      courseProgress.playbackProgress[pbIdx].playedSeconds = playedSeconds;
      if (durationSeconds > 0) courseProgress.playbackProgress[pbIdx].durationSeconds = durationSeconds;
      if (isComplete) courseProgress.playbackProgress[pbIdx].completed = true;
      courseProgress.playbackProgress[pbIdx].lastWatchedAt = Date.now();
    } else {
      courseProgress.playbackProgress.push({
        lessonId,
        playedSeconds,
        durationSeconds,
        completed: isComplete,
        lastWatchedAt: Date.now(),
      });
    }

    if (totalCount > 0) {
      courseProgress.progressPercentage = Math.min(
        100,
        Math.round((courseProgress.completedLessons.length / totalCount) * 100)
      );
    }

    await courseProgress.save();

    // If 100% complete, update enrollment status
    if (courseProgress.progressPercentage === 100) {
      await Enrollment.findOneAndUpdate(
        { userId, courseId, status: 'active' },
        { status: 'completed', completedAt: new Date() }
      );
    }

    return courseProgress;
  } catch (err) {
    // Under high-concurrency rapid parallel requests, Mongoose optimistic concurrency may throw VersionError;
    // this is harmless as another concurrent thread updates the same state.
    if (err.name !== 'VersionError') {
      console.error('Error syncing course progress:', err);
    }
    return null;
  }
}

/**
 * Middleware / Validator: Authorize enrollment and validate lesson relationship
 */
async function validateEnrollmentAndLesson(req, res, next) {
  const { enrollmentId, lessonId } = req.params;

  // Validate ObjectId formats
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    return res.status(400).json({ message: 'Invalid enrollment ID format.' });
  }

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    return res.status(404).json({ message: 'Enrollment not found.' });
  }

  // Authorization Check: Must be the enrolled user (admins permitted)
  const isOwner = enrollment.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      message: 'Forbidden: You do not have permission to access or modify this enrollment progress.',
    });
  }

  // If lessonId is present in route params, validate lesson exists and belongs to the enrolled course
  if (lessonId) {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID format.' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    if (lesson.courseId.toString() !== enrollment.courseId.toString()) {
      return res.status(400).json({
        message: 'Invalid relationship: Lesson does not belong to the enrolled course.',
      });
    }

    req.lesson = lesson;
  }

  req.enrollment = enrollment;
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/enrollments/course/:courseId
// @desc    Get active enrollment for current user by courseId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format.' });
    }

    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'No active enrollment found for this course.', isEnrolled: false });
    }

    res.json({ enrollment, isEnrolled: true });
  } catch (error) {
    console.error('Fetch course enrollment error:', error);
    res.status(500).json({ message: 'Error retrieving enrollment.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/enrollments/:enrollmentId/lessons/:lessonId/progress
// @desc    Retrieve saved progress for a specific lesson in an enrollment
// @access  Private (Scoped to enrollment owner)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:enrollmentId/lessons/:lessonId/progress', protect, validateEnrollmentAndLesson, async (req, res) => {
  try {
    const { enrollmentId, lessonId } = req.params;

    let progress = await LessonProgress.findOne({ enrollmentId, lessonId });

    if (!progress) {
      // Return default NOT_STARTED state
      return res.json({
        enrollment_id: enrollmentId,
        enrollmentId,
        lesson_id: lessonId,
        lessonId,
        status: 'NOT_STARTED',
        last_position_seconds: 0,
        lastPositionSeconds: 0,
        duration_seconds: 0,
        durationSeconds: 0,
        progress_percentage: 0,
        progressPercentage: 0,
        started_at: null,
        startedAt: null,
        last_accessed_at: null,
        lastAccessedAt: null,
        completed_at: null,
        completedAt: null,
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Retrieve lesson progress error:', error);
    res.status(500).json({ message: 'Error retrieving lesson progress.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/enrollments/:enrollmentId/lessons/:lessonId/progress
// @desc    Create or update playback progress (Scoped & Validated)
// @access  Private (Scoped to enrollment owner)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:enrollmentId/lessons/:lessonId/progress', protect, validateEnrollmentAndLesson, async (req, res) => {
  try {
    const { enrollmentId, lessonId } = req.params;
    const { enrollment, lesson } = req;

    // Normalize parameters (support both snake_case and camelCase)
    const rawPos =
      req.body.last_position_seconds !== undefined
        ? req.body.last_position_seconds
        : req.body.lastPositionSeconds !== undefined
        ? req.body.lastPositionSeconds
        : req.body.playedSeconds;

    const rawDur =
      req.body.duration_seconds !== undefined
        ? req.body.duration_seconds
        : req.body.durationSeconds !== undefined
        ? req.body.durationSeconds
        : req.body.totalDuration;

    const explicitCompleted = req.body.completed === true || req.body.status === 'COMPLETED';

    // Validate inputs
    const position = rawPos !== undefined ? Number(rawPos) : 0;
    const duration = rawDur !== undefined ? Number(rawDur) : 0;

    if (isNaN(position) || position < 0) {
      return res.status(400).json({ message: 'Playback position cannot be negative or invalid.' });
    }

    if (isNaN(duration) || duration < 0) {
      return res.status(400).json({ message: 'Video duration cannot be negative or invalid.' });
    }

    if (duration > 0 && position > duration) {
      return res.status(400).json({
        message: 'Playback position cannot exceed total video duration.',
      });
    }

    const safePosition = Math.round(position);
    const safeDuration = Math.round(duration);

    // Fetch existing progress record if any
    let existingProgress = await LessonProgress.findOne({ enrollmentId, lessonId });

    // Determine completion threshold: >= 90% or explicitly marked complete
    const isThresholdReached = safeDuration > 0 && safePosition >= Math.floor(safeDuration * 0.9);
    const wasAlreadyCompleted = existingProgress && existingProgress.status === 'COMPLETED';
    const isNowCompleted = wasAlreadyCompleted || explicitCompleted || isThresholdReached;

    // Determine status:
    // IMPORTANT: Do NOT automatically reset a completed lesson to In Progress when revisited!
    let newStatus = 'NOT_STARTED';
    if (isNowCompleted) {
      newStatus = 'COMPLETED';
    } else if (safePosition > 0 || (existingProgress && existingProgress.status === 'IN_PROGRESS')) {
      newStatus = 'IN_PROGRESS';
    }

    // Calculate safe progress percentage
    let calculatedPercentage = 0;
    if (newStatus === 'COMPLETED') {
      calculatedPercentage = 100;
    } else if (safeDuration > 0) {
      calculatedPercentage = Math.min(100, Math.round((safePosition / safeDuration) * 100));
    } else if (safePosition > 0) {
      calculatedPercentage = Math.min(99, Math.round(safePosition > 0 ? 10 : 0));
    }

    // Timestamps
    const now = new Date();
    const startedAt = existingProgress?.startedAt || (safePosition > 0 || isNowCompleted ? now : null);
    const completedAt = wasAlreadyCompleted
      ? existingProgress.completedAt
      : isNowCompleted
      ? now
      : null;

    // Upsert atomically
    const updateDoc = {
      $set: {
        enrollmentId,
        lessonId,
        status: newStatus,
        lastPositionSeconds: safePosition,
        durationSeconds: safeDuration,
        progressPercentage: calculatedPercentage,
        lastAccessedAt: now,
        completedAt,
      },
    };

    if (startedAt) {
      updateDoc.$set.startedAt = startedAt;
    }

    let progress;
    try {
      progress = await LessonProgress.findOneAndUpdate({ enrollmentId, lessonId }, updateDoc, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
    } catch (upsertErr) {
      // Concurrency guard: on rare duplicate key code 11000 race, retry once
      if (upsertErr.code === 11000) {
        progress = await LessonProgress.findOneAndUpdate({ enrollmentId, lessonId }, updateDoc, {
          new: true,
        });
      } else {
        throw upsertErr;
      }
    }

    // Keep course-level progress in sync
    await syncCourseProgress({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      lessonId,
      isComplete: newStatus === 'COMPLETED',
      playedSeconds: safePosition,
      durationSeconds: safeDuration,
    });

    // Record study time in daily activity calendar if learning
    if (safePosition > 0) {
      recordDailyActivity(enrollment.userId, {
        minutes: Math.max(1, Math.round(safePosition / 60)),
        lessonsCompleted: !wasAlreadyCompleted && isNowCompleted ? 1 : 0,
        courseId: enrollment.courseId,
      }).catch((e) => console.error('Activity sync error:', e));
    }

    res.json(progress);
  } catch (error) {
    console.error('Update lesson progress error:', error);
    res.status(500).json({ message: 'Error saving playback progress.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/enrollments/:enrollmentId/lessons/:lessonId/complete
// @desc    Mark a lesson as complete (Idempotent, Preserves Completion Timestamp)
// @access  Private (Scoped to enrollment owner)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:enrollmentId/lessons/:lessonId/complete', protect, validateEnrollmentAndLesson, async (req, res) => {
  try {
    const { enrollmentId, lessonId } = req.params;
    const { enrollment } = req;

    let existingProgress = await LessonProgress.findOne({ enrollmentId, lessonId });

    // Idempotent: If already completed, return successful response without altering original completedAt
    if (existingProgress && existingProgress.status === 'COMPLETED') {
      // Sync course progress as well
      await syncCourseProgress({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        lessonId,
        isComplete: true,
        playedSeconds: existingProgress.lastPositionSeconds,
        durationSeconds: existingProgress.durationSeconds,
      });

      return res.status(200).json({
        message: 'Lesson already marked as complete (idempotent).',
        isAlreadyCompleted: true,
        progress: existingProgress,
      });
    }

    const now = new Date();
    const updateDoc = {
      $set: {
        enrollmentId,
        lessonId,
        status: 'COMPLETED',
        progressPercentage: 100,
        completedAt: now,
        lastAccessedAt: now,
      },
      $setOnInsert: {
        startedAt: now,
        lastPositionSeconds: 0,
        durationSeconds: 0,
      },
    };

    let progress;
    try {
      progress = await LessonProgress.findOneAndUpdate({ enrollmentId, lessonId }, updateDoc, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
    } catch (upsertErr) {
      if (upsertErr.code === 11000) {
        progress = await LessonProgress.findOneAndUpdate(
          { enrollmentId, lessonId },
          {
            $set: {
              status: 'COMPLETED',
              progressPercentage: 100,
              completedAt: now,
              lastAccessedAt: now,
            },
          },
          { new: true }
        );
      } else {
        throw upsertErr;
      }
    }

    // Sync course-level progress
    const courseProg = await syncCourseProgress({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      lessonId,
      isComplete: true,
      playedSeconds: progress.lastPositionSeconds,
      durationSeconds: progress.durationSeconds,
    });

    // Record daily activity calendar
    await recordDailyActivity(enrollment.userId, {
      minutes: 15,
      lessonsCompleted: 1,
      courseId: enrollment.courseId,
    });

    // Determine next sequential lesson in course
    const allLessons = await getCourseLessonsInOrder(enrollment.courseId);
    const currentIndex = allLessons.findIndex((l) => l._id.toString() === lessonId.toString());
    const nextLesson =
      currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    res.status(200).json({
      message: 'Lesson marked as complete.',
      isAlreadyCompleted: false,
      progress,
      courseProgress: courseProg,
      nextLessonId: nextLesson ? nextLesson._id : null,
      nextLessonTitle: nextLesson ? nextLesson.title : null,
    });
  } catch (error) {
    console.error('Mark lesson complete error:', error);
    res.status(500).json({ message: 'Error marking lesson as complete.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/enrollments/:enrollmentId/progress
// @desc    Retrieve progress across all lessons in the enrollment
// @access  Private (Scoped to enrollment owner)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:enrollmentId/progress', protect, validateEnrollmentAndLesson, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { enrollment } = req;

    const courseId = enrollment.courseId;
    const allLessons = await getCourseLessonsInOrder(courseId);
    const totalLessons = allLessons.length;

    // Fetch all saved progress records for this enrollment
    const progressRecords = await LessonProgress.find({ enrollmentId });
    const progressMap = new Map();
    for (const record of progressRecords) {
      progressMap.set(record.lessonId.toString(), record);
    }

    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let lastAccessedLesson = null;
    let lastAccessedTime = 0;

    const lessonProgressList = allLessons.map((lesson) => {
      const lessonIdStr = lesson._id.toString();
      const existing = progressMap.get(lessonIdStr);

      if (existing) {
        if (existing.status === 'COMPLETED') {
          completedCount++;
        } else if (existing.status === 'IN_PROGRESS') {
          inProgressCount++;
        } else {
          notStartedCount++;
        }

        const accessedTime = new Date(existing.lastAccessedAt || 0).getTime();
        if (accessedTime > lastAccessedTime) {
          lastAccessedTime = accessedTime;
          lastAccessedLesson = existing;
        }

        return {
          lesson_id: lesson._id,
          lessonId: lesson._id,
          title: lesson.title,
          moduleId: lesson.moduleId,
          order: lesson.order,
          duration: lesson.duration,
          status: existing.status,
          last_position_seconds: existing.lastPositionSeconds,
          lastPositionSeconds: existing.lastPositionSeconds,
          duration_seconds: existing.durationSeconds,
          durationSeconds: existing.durationSeconds,
          progress_percentage: existing.progressPercentage,
          progressPercentage: existing.progressPercentage,
          started_at: existing.startedAt,
          startedAt: existing.startedAt,
          last_accessed_at: existing.lastAccessedAt,
          lastAccessedAt: existing.lastAccessedAt,
          completed_at: existing.completedAt,
          completedAt: existing.completedAt,
        };
      }

      notStartedCount++;
      return {
        lesson_id: lesson._id,
        lessonId: lesson._id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        order: lesson.order,
        duration: lesson.duration,
        status: 'NOT_STARTED',
        last_position_seconds: 0,
        lastPositionSeconds: 0,
        duration_seconds: 0,
        durationSeconds: 0,
        progress_percentage: 0,
        progressPercentage: 0,
        started_at: null,
        startedAt: null,
        last_accessed_at: null,
        lastAccessedAt: null,
        completed_at: null,
        completedAt: null,
      };
    });

    const overallPercentage =
      totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

    // Calculate smart resume lesson:
    // 1. If last accessed lesson is not completed, resume it
    // 2. Otherwise, first uncompleted lesson
    // 3. Fallback to first lesson
    let resumeLessonId = null;
    let resumePositionSeconds = 0;

    if (lastAccessedLesson && lastAccessedLesson.status !== 'COMPLETED') {
      resumeLessonId = lastAccessedLesson.lessonId;
      resumePositionSeconds = lastAccessedLesson.lastPositionSeconds || 0;
    } else {
      const firstUncompleted = lessonProgressList.find((l) => l.status !== 'COMPLETED');
      if (firstUncompleted) {
        resumeLessonId = firstUncompleted.lessonId;
        resumePositionSeconds = firstUncompleted.lastPositionSeconds || 0;
      } else if (allLessons.length > 0) {
        resumeLessonId = allLessons[0]._id;
        resumePositionSeconds = 0;
      }
    }

    res.json({
      enrollment_id: enrollmentId,
      enrollmentId,
      course_id: courseId,
      courseId,
      total_lessons: totalLessons,
      totalLessons,
      completed_count: completedCount,
      completedCount,
      in_progress_count: inProgressCount,
      inProgressCount,
      not_started_count: notStartedCount,
      notStartedCount,
      progress_percentage: overallPercentage,
      progressPercentage: overallPercentage,
      resume_lesson_id: resumeLessonId,
      resumeLessonId,
      resume_position_seconds: resumePositionSeconds,
      resumePositionSeconds,
      status_summary: {
        not_started: notStartedCount,
        in_progress: inProgressCount,
        completed: completedCount,
      },
      lessons: lessonProgressList,
    });
  } catch (error) {
    console.error('Retrieve enrollment progress error:', error);
    res.status(500).json({ message: 'Error retrieving enrollment progress summary.' });
  }
});

export default router;

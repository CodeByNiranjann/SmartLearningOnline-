import express from 'express';
import Progress from '../models/Progress.js';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import LearningActivity from '../models/LearningActivity.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Helper: Verify active course enrollment for the authenticated user
 * Scopes progress strictly to active enrollment. Admins have management bypass.
 */
async function verifyEnrollment(userId, courseId, userRole) {
  if (userRole === 'admin') return true;
  const enrollment = await Enrollment.findOne({
    userId,
    courseId,
    status: { $in: ['active', 'completed'] },
  });
  return Boolean(enrollment);
}

/**
 * Helper: Fetch all lessons in course order (by module order, then lesson order)
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress
// @desc    Get student's overall progress across all enrolled courses
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const progressList = await Progress.find({ userId: req.user._id })
      .populate('courseId')
      .populate('currentLesson')
      .populate('lastAccessedLesson');

    const totalCoursesStarted = progressList.length;
    const totalCoursesCompleted = progressList.filter((p) => p.progressPercentage === 100).length;
    const totalLessonsCompleted = progressList.reduce(
      (acc, p) => acc + (p.completedLessons ? p.completedLessons.length : 0),
      0
    );
    const overallProgress =
      totalCoursesStarted > 0
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/summary
// @desc  Server-computed progress dashboard for the authenticated student
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', protect, async (req, res) => {
  try {
    const QuizAttempt = (await import('../models/QuizAttempt.js')).default;

    const progressList = await Progress.find({ userId: req.user._id })
      .populate({
        path: 'courseId',
        select: 'title thumbnail category difficulty',
      });

    const summary = await Promise.all(
      progressList.map(async (p) => {
        const course = p.courseId;
        if (!course) return null;

        const modules = await Module.find({ courseId: course._id }).select('_id');
        const moduleIds = modules.map((m) => m._id);
        const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });

        const completedCount = p.completedLessons ? p.completedLessons.length : 0;
        const percentComplete = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        const completedIds = new Set((p.completedLessons || []).map((id) => id.toString()));
        let nextLesson = null;
        outer: for (const mod of modules) {
          const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 }).select('_id title');
          for (const lesson of lessons) {
            if (!completedIds.has(lesson._id.toString())) {
              nextLesson = { _id: lesson._id, title: lesson.title, courseId: course._id };
              break outer;
            }
          }
        }

        const recentAttempts = await QuizAttempt.find({
          user: req.user._id,
          course: course._id,
          status: 'submitted',
        })
          .sort({ submittedAt: -1 })
          .limit(3)
          .populate('quiz', 'title passingScore')
          .select('score maxScore percentage passed submittedAt quiz');

        return {
          courseId: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          category: course.category,
          difficulty: course.difficulty,
          totalLessons,
          completedLessons: completedCount,
          percentComplete,
          isCompleted: percentComplete >= 100,
          lastAccessedAt: p.lastAccessedAt,
          nextLesson,
          recentQuizAttempts: recentAttempts,
        };
      })
    );

    const validSummary = summary.filter(Boolean);
    const overallPercent = validSummary.length > 0
      ? Math.round(validSummary.reduce((a, c) => a + c.percentComplete, 0) / validSummary.length)
      : 0;
    const completedCourses = validSummary.filter((c) => c.isCompleted).length;

    const allAttempts = await QuizAttempt.find({ user: req.user._id, status: 'submitted' });
    const avgQuizScore = allAttempts.length > 0
      ? Math.round(allAttempts.reduce((a, c) => a + (c.percentage || 0), 0) / allAttempts.length)
      : null;
    const passedQuizzes = allAttempts.filter((a) => a.passed).length;

    res.json({
      enrolledCourses: validSummary,
      overallPercent,
      completedCourses,
      totalEnrolled: validSummary.length,
      quizStats: {
        total: allAttempts.length,
        passed: passedQuizzes,
        avgScore: avgQuizScore,
      },
    });
  } catch (error) {
    console.error('Progress summary error:', error);
    res.status(500).json({ message: 'Error computing progress summary: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/achievements
// @desc  Student achievements: completed courses, passed quizzes, graded tasks
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/achievements', protect, async (req, res) => {
  try {
    const QuizAttempt = (await import('../models/QuizAttempt.js')).default;

    const progressList = await Progress.find({ userId: req.user._id })
      .populate({ path: 'courseId', select: 'title thumbnail category difficulty' });

    const completedCourseAchievements = await Promise.all(
      progressList.map(async (p) => {
        const course = p.courseId;
        if (!course) return null;
        const modules = await Module.find({ courseId: course._id }).select('_id');
        const moduleIds = modules.map((m) => m._id);
        const totalLessons = await Lesson.countDocuments({ moduleId: { $in: moduleIds } });
        const completedCount = p.completedLessons?.length || 0;
        if (totalLessons > 0 && completedCount >= totalLessons) {
          return {
            type: 'course_completed',
            title: `Completed: ${course.title}`,
            courseId: course._id,
            courseName: course.title,
            thumbnail: course.thumbnail,
            category: course.category,
            lessonsCompleted: completedCount,
            totalLessons,
            earnedAt: p.updatedAt,
          };
        }
        return null;
      })
    );

    const passedAttempts = await QuizAttempt.find({
      user: req.user._id,
      status: 'submitted',
      passed: true,
    })
      .populate('quiz', 'title passingScore')
      .populate('course', 'title')
      .sort({ submittedAt: -1 });

    const passedQuizAchievements = passedAttempts.map((a) => ({
      type: 'quiz_passed',
      title: `Passed: ${a.quiz?.title || 'Quiz'}`,
      quizId: a.quiz?._id,
      quizTitle: a.quiz?.title,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      courseName: a.course?.title,
      earnedAt: a.submittedAt,
    }));

    let taskAchievements = [];
    try {
      const TaskSubmission = (await import('../models/TaskSubmission.js')).default;
      const gradedSubmissions = await TaskSubmission.find({
        student: req.user._id,
        status: 'graded',
      })
        .populate('task', 'title maxPoints course')
        .populate({ path: 'task', populate: { path: 'course', select: 'title' } })
        .sort({ gradedAt: -1 });

      taskAchievements = gradedSubmissions.map((s) => ({
        type: 'task_graded',
        title: `Graded Task: ${s.task?.title || 'Practical Task'}`,
        taskId: s.task?._id,
        taskTitle: s.task?.title,
        score: s.score,
        maxPoints: s.task?.maxPoints,
        feedback: s.feedback,
        courseName: s.task?.course?.title,
        earnedAt: s.gradedAt,
      }));
    } catch (e) {
      // ignore
    }

    const allAchievements = [
      ...completedCourseAchievements.filter(Boolean),
      ...passedQuizAchievements,
      ...taskAchievements,
    ].sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));

    res.json({
      achievements: allAchievements,
      summary: {
        completedCourses: completedCourseAchievements.filter(Boolean).length,
        passedQuizzes: passedAttempts.length,
        gradedTasks: taskAchievements.length,
        total: allAchievements.length,
      },
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({ message: 'Error retrieving achievements: ' + error.message });
  }
});

/**
 * Helper: Map learning minutes to color intensity level (0 = light/empty, 4 = dark)
 */
function getIntensityLevel(minutes) {
  if (!minutes || minutes <= 0) return 0;
  if (minutes <= 20) return 1; // Light
  if (minutes <= 45) return 2; // Moderate
  if (minutes <= 75) return 3; // Active
  return 4; // Dark / Intensive
}

/**
 * Helper: Record or update daily study activity
 */
async function recordDailyActivity(userId, { minutes = 0, lessonsCompleted = 0, courseId = null, customDate = null }) {
  try {
    const dateStr = customDate || new Date().toISOString().slice(0, 10);
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
    console.error('Record daily activity error:', err);
    return null;
  }
}

/**
 * Helper: Calculate current and longest consecutive study streaks
 */
function calculateStreaks(dateStrings) {
  if (!dateStrings || dateStrings.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedDates = Array.from(new Set(dateStrings)).sort();

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    const curr = new Date(`${dateStr}T00:00:00Z`);
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffMs = curr.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = curr;
  }

  // Calculate current streak
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let currentStreak = 0;
  const lastActiveDateStr = sortedDates[sortedDates.length - 1];

  if (lastActiveDateStr === todayStr || lastActiveDateStr === yesterdayStr) {
    let checkDate = new Date(`${lastActiveDateStr}T00:00:00Z`);
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const prev = new Date(`${sortedDates[i]}T00:00:00Z`);
      const diffDays = Math.round((checkDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
        checkDate = prev;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/calendar
// @desc    Get student learning calendar activity & light-to-dark color metrics
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/calendar', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch all logged activities for this student
    let activities = await LearningActivity.find({ userId }).sort({ date: 1 });

    // 2. If student has recorded progress but no activity entries, auto-sync from Progress
    if (activities.length === 0) {
      const allProgress = await Progress.find({ userId });
      for (const prog of allProgress) {
        if (prog.playbackProgress && prog.playbackProgress.length > 0) {
          for (const pb of prog.playbackProgress) {
            const dateStr = (pb.lastWatchedAt || prog.lastAccessedAt || prog.updatedAt || new Date())
              .toISOString()
              .slice(0, 10);
            const minutes = Math.max(5, Math.round((pb.playedSeconds || 600) / 60));
            await recordDailyActivity(userId, {
              minutes,
              lessonsCompleted: pb.completed ? 1 : 0,
              courseId: prog.courseId,
              customDate: dateStr,
            });
          }
        } else if (prog.completedLessons && prog.completedLessons.length > 0) {
          const dateStr = (prog.lastAccessedAt || prog.updatedAt || new Date()).toISOString().slice(0, 10);
          await recordDailyActivity(userId, {
            minutes: prog.completedLessons.length * 15,
            lessonsCompleted: prog.completedLessons.length,
            courseId: prog.courseId,
            customDate: dateStr,
          });
        }
      }
      activities = await LearningActivity.find({ userId }).sort({ date: 1 });
    }

    // 3. Build lookup map with light-to-dark intensity levels
    const activitiesMap = {};
    const activeDates = [];
    let totalMinutes = 0;
    let totalLessonsCompleted = 0;

    for (const act of activities) {
      const minutes = act.durationMinutes || 0;
      const lessons = act.lessonsCompleted || 0;
      if (minutes > 0 || lessons > 0) {
        activeDates.push(act.date);
        totalMinutes += minutes;
        totalLessonsCompleted += lessons;
      }
      activitiesMap[act.date] = {
        date: act.date,
        durationMinutes: minutes,
        lessonsCompleted: lessons,
        level: getIntensityLevel(minutes),
        coursesStudied: act.coursesStudied || [],
        lastActiveAt: act.lastActiveAt,
      };
    }

    const { currentStreak, longestStreak } = calculateStreaks(activeDates);
    const activeDays = activeDates.length;
    const totalHours = (totalMinutes / 60).toFixed(1);
    const averageMinutesPerActiveDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    res.json({
      summary: {
        totalMinutes,
        totalHours,
        activeDays,
        currentStreak,
        longestStreak,
        totalLessonsCompleted,
        averageMinutesPerActiveDay,
      },
      activities: activitiesMap,
      activitiesList: activities.map((a) => ({
        date: a.date,
        durationMinutes: a.durationMinutes,
        lessonsCompleted: a.lessonsCompleted,
        level: getIntensityLevel(a.durationMinutes),
      })),
    });
  } catch (error) {
    console.error('Fetch learning calendar error:', error);
    res.status(500).json({ message: 'Error fetching learning calendar activity' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/log-study-time
// @desc    Log active learning time spent on website (increments daily study minutes)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/log-study-time', protect, async (req, res) => {
  try {
    const { courseId, minutes = 1 } = req.body;
    const safeMinutes = Math.max(1, Math.min(180, Number(minutes) || 1));

    const activity = await recordDailyActivity(req.user._id, {
      minutes: safeMinutes,
      courseId,
    });

    res.json({
      message: 'Study time successfully logged.',
      activity,
      level: activity ? getIntensityLevel(activity.durationMinutes) : 0,
    });
  } catch (error) {
    console.error('Log study time error:', error);
    res.status(500).json({ message: 'Error logging study time' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/seed-calendar
// @desc    Seed sample learning history for instant visualization of light-to-dark colors
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/seed-calendar', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Sample study sessions over the past 28 days with diverse intensities
    const sampleDays = [
      { offsetDays: 0, minutes: 45, lessons: 1 },  // Today (Level 2)
      { offsetDays: 1, minutes: 80, lessons: 3 },  // Yesterday (Level 4 - Dark)
      { offsetDays: 2, minutes: 30, lessons: 1 },  // (Level 2)
      { offsetDays: 3, minutes: 60, lessons: 2 },  // (Level 3 - Active)
      { offsetDays: 4, minutes: 15, lessons: 1 },  // (Level 1 - Light)
      { offsetDays: 6, minutes: 25, lessons: 1 },  // (Level 2)
      { offsetDays: 7, minutes: 90, lessons: 3 },  // (Level 4 - Dark)
      { offsetDays: 8, minutes: 50, lessons: 2 },  // (Level 3)
      { offsetDays: 10, minutes: 10, lessons: 0 }, // (Level 1 - Light)
      { offsetDays: 12, minutes: 70, lessons: 2 }, // (Level 3)
      { offsetDays: 13, minutes: 40, lessons: 1 }, // (Level 2)
      { offsetDays: 14, minutes: 110, lessons: 4 },// (Level 4 - Darkest)
      { offsetDays: 15, minutes: 20, lessons: 1 }, // (Level 1)
      { offsetDays: 18, minutes: 65, lessons: 2 }, // (Level 3)
      { offsetDays: 20, minutes: 15, lessons: 1 }, // (Level 1)
      { offsetDays: 21, minutes: 85, lessons: 3 }, // (Level 4)
      { offsetDays: 23, minutes: 35, lessons: 1 }, // (Level 2)
      { offsetDays: 25, minutes: 45, lessons: 2 }, // (Level 2)
    ];

    for (const sample of sampleDays) {
      const d = new Date(now);
      d.setDate(d.getDate() - sample.offsetDays);
      const dateStr = d.toISOString().slice(0, 10);

      let act = await LearningActivity.findOne({ userId, date: dateStr });
      if (!act) {
        act = new LearningActivity({
          userId,
          date: dateStr,
          durationMinutes: sample.minutes,
          lessonsCompleted: sample.lessons,
          lastActiveAt: d,
        });
        await act.save();
      }
    }

    res.json({ message: 'Sample learning activity successfully seeded for demonstration.' });
  } catch (error) {
    console.error('Seed calendar error:', error);
    res.status(500).json({ message: 'Error seeding calendar activity' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/:courseId
// @desc    Get progress for a specific course, including resume point and playback
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check enrollment
    const isEnrolled = await verifyEnrollment(req.user._id, courseId, req.user.role);
    if (!isEnrolled) {
      return res.status(403).json({
        message: 'You must be enrolled in this course to track and view progress.',
        isEnrolled: false,
      });
    }

    const allLessons = await getCourseLessonsInOrder(courseId);
    let progress = await Progress.findOne({ userId: req.user._id, courseId })
      .populate('currentLesson')
      .populate('lastAccessedLesson');

    if (!progress) {
      // Return initial resume state (first lesson in course)
      const firstLesson = allLessons[0] || null;
      return res.json({
        userId: req.user._id,
        courseId,
        completedLessons: [],
        currentLesson: firstLesson ? firstLesson._id : null,
        lastAccessedLesson: firstLesson ? firstLesson._id : null,
        resumeLessonId: firstLesson ? firstLesson._id : null,
        playbackProgress: [],
        progressPercentage: 0,
        isEnrolled: true,
      });
    }

    // Determine the optimal resume point:
    // 1. If lastAccessedLesson is uncompleted, resume it
    // 2. Otherwise, first uncompleted lesson in chronological order
    // 3. Fallback to last accessed lesson or first lesson
    let resumeLessonId = null;
    const completedSet = new Set(progress.completedLessons.map((id) => id.toString()));

    if (progress.lastAccessedLesson && !completedSet.has(progress.lastAccessedLesson._id.toString())) {
      resumeLessonId = progress.lastAccessedLesson._id;
    } else {
      const firstUncompleted = allLessons.find((l) => !completedSet.has(l._id.toString()));
      if (firstUncompleted) {
        resumeLessonId = firstUncompleted._id;
      } else if (progress.lastAccessedLesson) {
        resumeLessonId = progress.lastAccessedLesson._id;
      } else if (allLessons.length > 0) {
        resumeLessonId = allLessons[0]._id;
      }
    }

    // Lookup any saved playback seconds for the resume lesson
    let resumePlaybackSeconds = 0;
    if (resumeLessonId && Array.isArray(progress.playbackProgress)) {
      const pb = progress.playbackProgress.find(
        (p) => p.lessonId && p.lessonId.toString() === resumeLessonId.toString()
      );
      if (pb && !pb.completed) {
        resumePlaybackSeconds = pb.playedSeconds || 0;
      }
    }

    res.json({
      ...progress.toObject(),
      resumeLessonId,
      resumePlaybackSeconds,
      isEnrolled: true,
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Error fetching course progress' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/complete-lesson
// @desc    Mark a lesson as complete (Idempotent and scoped to enrollment)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/complete-lesson', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId and lessonId are required.' });
    }

    // 1. SCOPED TO ENROLLMENT: User must be actively enrolled
    const isEnrolled = await verifyEnrollment(req.user._id, courseId, req.user.role);
    if (!isEnrolled) {
      return res.status(403).json({
        message: 'You must be actively enrolled in this course to complete lessons.',
      });
    }

    // 2. Validate lesson exists and belongs to this course
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }
    if (lesson.courseId.toString() !== courseId.toString()) {
      return res.status(400).json({ message: 'Lesson does not belong to the specified course.' });
    }

    // 3. Get ordered course lessons to calculate percentage and next lesson
    const allLessons = await getCourseLessonsInOrder(courseId);
    const totalLessonsCount = allLessons.length;
    if (totalLessonsCount === 0) {
      return res.status(400).json({ message: 'No lessons found in this course.' });
    }

    let progress = await Progress.findOne({ userId: req.user._id, courseId });

    // 4. IDEMPOTENT COMPLETION LOGIC
    let isAlreadyCompleted = false;

    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        courseId,
        completedLessons: [lessonId],
        currentLesson: lessonId,
        lastAccessedLesson: lessonId,
        progressPercentage: Math.min(100, Math.round((1 / totalLessonsCount) * 100)),
        lastAccessedAt: Date.now(),
      });
    } else {
      const alreadyHasLesson = progress.completedLessons.some(
        (id) => id.toString() === lessonId.toString()
      );

      if (alreadyHasLesson) {
        // Idempotent: Lesson already counted, do not duplicate!
        isAlreadyCompleted = true;
      } else {
        progress.completedLessons.push(lessonId);
      }

      progress.currentLesson = lessonId;
      progress.lastAccessedLesson = lessonId;
      progress.lastAccessedAt = Date.now();

      // Recalculate percentage based on unique completed lessons
      const completedCount = progress.completedLessons.length;
      progress.progressPercentage = Math.min(
        100,
        Math.round((completedCount / totalLessonsCount) * 100)
      );
      progress.updatedAt = Date.now();
    }

    // Mark playback record as completed if it exists
    if (!progress.playbackProgress) progress.playbackProgress = [];
    const pbIndex = progress.playbackProgress.findIndex(
      (p) => p.lessonId.toString() === lessonId.toString()
    );
    if (pbIndex >= 0) {
      progress.playbackProgress[pbIndex].completed = true;
      progress.playbackProgress[pbIndex].lastWatchedAt = Date.now();
    } else {
      progress.playbackProgress.push({
        lessonId,
        playedSeconds: 0,
        durationSeconds: 0,
        completed: true,
        lastWatchedAt: Date.now(),
      });
    }

    await progress.save();

    // 5. Update course enrollment if 100% complete
    if (progress.progressPercentage === 100) {
      await Enrollment.findOneAndUpdate(
        { userId: req.user._id, courseId, status: 'active' },
        { status: 'completed', completedAt: new Date() }
      );
    }

    // Find next sequential lesson for smooth user navigation
    const currentIndex = allLessons.findIndex((l) => l._id.toString() === lessonId.toString());
    const nextLesson =
      currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // Check if the current module is now fully completed
    const moduleLessons = await Lesson.find({ moduleId: lesson.moduleId });
    const completedSetAfter = new Set(progress.completedLessons.map((id) => id.toString()));
    const isModuleCompleted =
      moduleLessons.length > 0 && moduleLessons.every((l) => completedSetAfter.has(l._id.toString()));
    const currentModule = await Module.findById(lesson.moduleId);
    const isNextLessonInNewModule = Boolean(
      nextLesson && nextLesson.moduleId.toString() !== lesson.moduleId.toString()
    );

    // If new completion, record daily activity for calendar
    if (!isAlreadyCompleted) {
      await recordDailyActivity(req.user._id, {
        minutes: 15,
        lessonsCompleted: 1,
        courseId,
      });
    }

    res.json({
      message: isAlreadyCompleted
        ? 'Lesson was already marked as complete (idempotent).'
        : 'Lesson marked as complete.',
      isAlreadyCompleted,
      isModuleCompleted,
      completedModuleTitle: currentModule ? currentModule.title : null,
      isNextLessonInNewModule,
      progress,
      nextLessonId: nextLesson ? nextLesson._id : null,
      nextLessonTitle: nextLesson ? nextLesson.title : null,
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ message: 'Error updating lesson progress.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/complete-module
// @desc    Mark all lessons in a module as complete
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/complete-module', protect, async (req, res) => {
  try {
    const { courseId, moduleId } = req.body;

    if (!courseId || !moduleId) {
      return res.status(400).json({ message: 'courseId and moduleId are required.' });
    }

    // 1. SCOPED TO ENROLLMENT: User must be actively enrolled
    const isEnrolled = await verifyEnrollment(req.user._id, courseId, req.user.role);
    if (!isEnrolled) {
      return res.status(403).json({
        message: 'You must be actively enrolled in this course to complete modules.',
      });
    }

    // 2. Validate module exists and belongs to course
    const module = await Module.findById(moduleId);
    if (!module || module.courseId.toString() !== courseId.toString()) {
      return res.status(404).json({ message: 'Module not found in this course.' });
    }

    // 3. Find lessons in this module
    const moduleLessons = await Lesson.find({ moduleId: module._id }).sort({ order: 1 });
    if (moduleLessons.length === 0) {
      return res.status(400).json({ message: 'No lessons found in this module.' });
    }

    // 4. Get all course lessons for overall percentage calculation
    const allLessons = await getCourseLessonsInOrder(courseId);
    let progress = await Progress.findOne({ userId: req.user._id, courseId });

    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        courseId,
        completedLessons: [],
        currentLesson: moduleLessons[0]._id,
        lastAccessedLesson: moduleLessons[0]._id,
        progressPercentage: 0,
        lastAccessedAt: Date.now(),
      });
    }

    const existingSet = new Set(progress.completedLessons.map((id) => id.toString()));
    let newCompletions = 0;

    for (const l of moduleLessons) {
      const lId = l._id.toString();
      if (!existingSet.has(lId)) {
        progress.completedLessons.push(l._id);
        existingSet.add(lId);
        newCompletions++;
      }
    }

    const lastModuleLesson = moduleLessons[moduleLessons.length - 1];
    progress.currentLesson = lastModuleLesson._id;
    progress.lastAccessedLesson = lastModuleLesson._id;
    progress.lastAccessedAt = Date.now();
    progress.progressPercentage = Math.min(
      100,
      Math.round((progress.completedLessons.length / allLessons.length) * 100)
    );
    progress.updatedAt = Date.now();

    await progress.save();

    // If 100% complete, update enrollment
    if (progress.progressPercentage === 100) {
      await Enrollment.findOneAndUpdate(
        { userId: req.user._id, courseId, status: 'active' },
        { status: 'completed', completedAt: new Date() }
      );
    }

    // Find next sequential lesson in the course (e.g., in the next module)
    const lastLessonIndex = allLessons.findIndex(
      (l) => l._id.toString() === lastModuleLesson._id.toString()
    );
    const nextLesson =
      lastLessonIndex >= 0 && lastLessonIndex < allLessons.length - 1
        ? allLessons[lastLessonIndex + 1]
        : null;

    if (newCompletions > 0) {
      await recordDailyActivity(req.user._id, {
        minutes: newCompletions * 15,
        lessonsCompleted: newCompletions,
        courseId,
      });
    }

    res.json({
      message: `Module "${module.title}" completed successfully!`,
      moduleTitle: module.title,
      isModuleCompleted: true,
      progress,
      nextLessonId: nextLesson ? nextLesson._id : null,
      nextLessonTitle: nextLesson ? nextLesson.title : null,
      isCourseCompleted: progress.progressPercentage === 100,
    });
  } catch (error) {
    console.error('Complete module error:', error);
    res.status(500).json({ message: 'Error completing module.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/playback
// @desc    Track video playback timestamp (Survives sessions and scoped to enrollment)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/playback', protect, async (req, res) => {
  try {
    const { courseId, lessonId, playedSeconds = 0, durationSeconds = 0, completed = false } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: 'courseId and lessonId are required.' });
    }

    // Scoped to enrollment
    const isEnrolled = await verifyEnrollment(req.user._id, courseId, req.user.role);
    if (!isEnrolled) {
      return res.status(403).json({
        message: 'You must be actively enrolled in this course to track playback progress.',
      });
    }

    let progress = await Progress.findOne({ userId: req.user._id, courseId });
    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        courseId,
        completedLessons: [],
        currentLesson: lessonId,
        lastAccessedLesson: lessonId,
        playbackProgress: [],
        progressPercentage: 0,
        lastAccessedAt: Date.now(),
      });
    }

    // Update last accessed lesson
    progress.lastAccessedLesson = lessonId;
    progress.currentLesson = lessonId;
    progress.lastAccessedAt = Date.now();
    progress.updatedAt = Date.now();

    // Upsert playback entry for this lesson
    if (!progress.playbackProgress) progress.playbackProgress = [];
    const pbIndex = progress.playbackProgress.findIndex(
      (p) => p.lessonId.toString() === lessonId.toString()
    );

    const safePlayed = Math.max(0, Math.round(Number(playedSeconds) || 0));
    const safeDuration = Math.max(0, Math.round(Number(durationSeconds) || 0));

    if (pbIndex >= 0) {
      progress.playbackProgress[pbIndex].playedSeconds = safePlayed;
      if (safeDuration > 0) progress.playbackProgress[pbIndex].durationSeconds = safeDuration;
      if (completed) progress.playbackProgress[pbIndex].completed = true;
      progress.playbackProgress[pbIndex].lastWatchedAt = Date.now();
    } else {
      progress.playbackProgress.push({
        lessonId,
        playedSeconds: safePlayed,
        durationSeconds: safeDuration,
        completed: Boolean(completed),
        lastWatchedAt: Date.now(),
      });
    }

    // If marked completed or watched > 90%, idempotently add to completedLessons
    if (completed || (safeDuration > 0 && safePlayed >= safeDuration * 0.9)) {
      if (!progress.completedLessons.some((id) => id.toString() === lessonId.toString())) {
        progress.completedLessons.push(lessonId);
        const allLessons = await getCourseLessonsInOrder(courseId);
        if (allLessons.length > 0) {
          progress.progressPercentage = Math.min(
            100,
            Math.round((progress.completedLessons.length / allLessons.length) * 100)
          );
        }
      }
    }

    await progress.save();

    // Record study time into daily learning calendar
    if (safePlayed > 0) {
      const minutesLogged = Math.max(1, Math.round(safePlayed / 60));
      recordDailyActivity(req.user._id, {
        minutes: Math.min(minutesLogged, 30),
        courseId,
      }).catch((e) => console.error('Activity sync error:', e));
    }

    res.json({
      message: 'Playback progress synchronized successfully.',
      playedSeconds: safePlayed,
      lastAccessedLesson: lessonId,
    });
  } catch (error) {
    console.error('Update playback progress error:', error);
    res.status(500).json({ message: 'Error updating playback progress.' });
  }
});

export default router;

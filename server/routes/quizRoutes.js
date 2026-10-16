import express from 'express';
import Quiz from '../models/Quiz.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * Validates a single question object against SCRUM-48 requirements:
 * - Question text required
 * - MCQ (single or multiple) needs at least 2 options and at least 1 correct answer
 * - True/False needs a correct value
 * - Short answer needs an accepted answer
 */
function validateQuestion(q, idx) {
  const num = idx + 1;
  if (!q || typeof q !== 'object') {
    return `Question #${num} is invalid.`;
  }
  if (!q.questionText || typeof q.questionText !== 'string' || !q.questionText.trim()) {
    return `Question #${num} must include question text.`;
  }

  const type = q.type || 'single_choice';
  const validTypes = ['single_choice', 'multiple_choice', 'true_false', 'short_answer'];
  if (!validTypes.includes(type)) {
    return `Question #${num} has an unsupported question type "${type}".`;
  }

  if (type === 'single_choice') {
    if (!Array.isArray(q.options) || q.options.filter((opt) => typeof opt === 'string' && opt.trim()).length < 2) {
      return `Question #${num} (MCQ Single Answer) requires at least 2 options.`;
    }
    const cleanOptions = q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : ''));
    if (
      typeof q.correctOptionIndex !== 'number' ||
      q.correctOptionIndex < 0 ||
      q.correctOptionIndex >= cleanOptions.length
    ) {
      return `Question #${num} (MCQ Single Answer) requires 1 correct answer option selected.`;
    }
  } else if (type === 'multiple_choice') {
    if (!Array.isArray(q.options) || q.options.filter((opt) => typeof opt === 'string' && opt.trim()).length < 2) {
      return `Question #${num} (MCQ Multiple Answer) requires at least 2 options.`;
    }
    const cleanOptions = q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : ''));
    if (!Array.isArray(q.correctOptions) || q.correctOptions.length === 0) {
      return `Question #${num} (MCQ Multiple Answer) requires at least 1 correct answer selected.`;
    }
    const invalidSelection = q.correctOptions.some(
      (sel) => typeof sel !== 'number' || sel < 0 || sel >= cleanOptions.length
    );
    if (invalidSelection) {
      return `Question #${num} (MCQ Multiple Answer) contains an invalid correct answer selection.`;
    }
  } else if (type === 'true_false') {
    const hasBool = typeof q.correctBoolean === 'boolean';
    const hasIdx = typeof q.correctOptionIndex === 'number' && (q.correctOptionIndex === 0 || q.correctOptionIndex === 1);
    if (!hasBool && !hasIdx) {
      return `Question #${num} (True/False) requires a correct value (True or False).`;
    }
  } else if (type === 'short_answer') {
    const hasAcceptedArr = Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.some((ans) => typeof ans === 'string' && ans.trim());
    const hasAcceptedStr = typeof q.acceptedAnswer === 'string' && q.acceptedAnswer.trim();
    if (!hasAcceptedArr && !hasAcceptedStr) {
      return `Question #${num} (Short Answer) requires at least one accepted answer.`;
    }
  }

  return null;
}

/**
 * Normalizes question data before storing in MongoDB
 */
function formatQuestionForSave(q, idx) {
  const type = q.type || 'single_choice';
  const formatted = {
    questionText: q.questionText.trim(),
    type,
    explanation: q.explanation ? q.explanation.trim() : '',
    points: typeof q.points === 'number' && q.points > 0 ? q.points : 1,
    order: typeof q.order === 'number' ? q.order : idx,
  };

  if (type === 'single_choice') {
    formatted.options = q.options.map((o) => (typeof o === 'string' ? o.trim() : String(o)));
    formatted.correctOptionIndex = Number(q.correctOptionIndex);
    formatted.correctOptions = [Number(q.correctOptionIndex)];
  } else if (type === 'multiple_choice') {
    formatted.options = q.options.map((o) => (typeof o === 'string' ? o.trim() : String(o)));
    formatted.correctOptions = Array.from(new Set(q.correctOptions.map(Number))).sort((a, b) => a - b);
    formatted.correctOptionIndex = formatted.correctOptions[0] ?? 0;
  } else if (type === 'true_false') {
    formatted.options = ['True', 'False'];
    if (typeof q.correctBoolean === 'boolean') {
      formatted.correctBoolean = q.correctBoolean;
      formatted.correctOptionIndex = q.correctBoolean ? 0 : 1;
    } else {
      const idxVal = Number(q.correctOptionIndex);
      formatted.correctOptionIndex = idxVal;
      formatted.correctBoolean = idxVal === 0;
    }
  } else if (type === 'short_answer') {
    let answers = [];
    if (Array.isArray(q.acceptedAnswers)) {
      answers = q.acceptedAnswers.map((a) => String(a).trim()).filter(Boolean);
    } else if (typeof q.acceptedAnswer === 'string') {
      answers = q.acceptedAnswer.split(',').map((a) => a.trim()).filter(Boolean);
    }
    formatted.acceptedAnswers = answers;
    formatted.options = [];
  }

  return formatted;
}

// ==========================================
// ROUTES
// ==========================================

// @route   GET /api/quizzes
// @desc    List quizzes: Instructors see their own course quizzes; Admins can view all
// @access  Private — instructor or admin
router.get('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId, search, status } = req.query;
    let query = {};

    if (req.user.role === 'admin') {
      // Admins can view all quizzes
      if (courseId) {
        query.courseId = courseId;
      }
    } else {
      // Instructors only see quizzes for courses they teach/own
      const instructorCourses = await Course.find({ instructorId: req.user._id }).select('_id');
      const courseIds = instructorCourses.map((c) => c._id);

      if (courseId) {
        // Ensure requested course belongs to instructor
        const owns = courseIds.some((id) => id.toString() === courseId.toString());
        if (!owns) {
          return res.status(403).json({ message: 'You do not have access to quizzes for this course.' });
        }
        query.courseId = courseId;
      } else {
        query.$or = [{ instructorId: req.user._id }, { courseId: { $in: courseIds } }];
      }
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const total = await Quiz.countDocuments(query);
    const quizzes = await Quiz.find(query)
      .populate('courseId', 'title thumbnail category difficulty instructor instructorId')
      .populate('instructorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      quizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('List quizzes error:', error);
    res.status(500).json({ message: 'Error fetching quizzes.' });
  }
});

// @route   GET /api/quizzes/student
// @desc    List quizzes from student's enrolled courses with progress metrics
// @access  Private — student, instructor, or admin
router.get('/student', protect, async (req, res) => {
  try {
    const { search, courseId } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    // Discover courses the student is enrolled in
    const [enrollments, progresses] = await Promise.all([
      Enrollment.find({
        userId: req.user._id,
        status: { $in: ['active', 'completed'] },
      }).select('courseId'),
      Progress.find({ userId: req.user._id }).select('courseId'),
    ]);

    const enrolledSet = new Set([
      ...enrollments.map((e) => e.courseId?.toString()),
      ...progresses.map((p) => p.courseId?.toString()),
    ]);
    const enrolledCourseIds = Array.from(enrolledSet).filter(Boolean);

    // If student is not enrolled in any course, return empty list cleanly
    if (enrolledCourseIds.length === 0) {
      return res.json({
        quizzes: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    const query = {
      courseId: { $in: enrolledCourseIds },
      status: 'published',
    };

    if (courseId && enrolledCourseIds.includes(courseId)) {
      query.courseId = courseId;
    }

    if (search) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const total = await Quiz.countDocuments(query);
    const quizDocs = await Quiz.find(query)
      .populate('courseId', 'title thumbnail category difficulty instructor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Attach student attempt metrics (best score, attempts used, passed, in-progress attempt)
    const quizIds = quizDocs.map((q) => q._id);
    const userAttempts = await QuizAttempt.find({
      user: req.user._id,
      quiz: { $in: quizIds },
    }).sort({ submittedAt: -1 });

    const studentQuizzes = quizDocs.map((quiz) => {
      const qAttempts = userAttempts.filter(
        (a) => a.quiz?.toString() === quiz._id.toString()
      );
      const submittedAttempts = qAttempts.filter((a) => a.status === 'submitted');
      const inProgressAttempt = qAttempts.find((a) => a.status === 'in_progress');

      let bestScore = null;
      let hasPassed = false;

      if (submittedAttempts.length > 0) {
        bestScore = Math.max(...submittedAttempts.map((a) => a.percentage || 0));
        hasPassed = submittedAttempts.some((a) => a.passed === true);
      }

      const attemptsUsed = submittedAttempts.length;
      const maxAttempts = quiz.maxAttempts || 0;
      const canAttempt = maxAttempts === 0 || attemptsUsed < maxAttempts;

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        courseId: quiz.courseId,
        questionCount: quiz.questions?.length || 0,
        timeLimit: quiz.timeLimit || 0,
        maxAttempts,
        passingScore: quiz.passingScore || 50,
        attemptsUsed,
        bestScore,
        hasPassed,
        canAttempt,
        inProgressAttemptId: inProgressAttempt?._id || null,
      };
    });

    res.json({
      quizzes: studentQuizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('List student quizzes error:', error);
    res.status(500).json({ message: 'Error fetching enrolled quizzes.' });
  }
});

// @route   GET /api/quizzes/:id/details
// @desc    Get sanitized quiz metadata and questions for student attempt
// @access  Private — enrolled student
router.get('/:id/details', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title thumbnail category difficulty instructor');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (quiz.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This quiz is not currently available.' });
    }

    // Verify enrollment
    const isEnrolled = await Enrollment.findOne({
      userId: req.user._id,
      courseId: quiz.courseId?._id || quiz.courseId,
      status: { $in: ['active', 'completed'] },
    }) || await Progress.findOne({
      userId: req.user._id,
      courseId: quiz.courseId?._id || quiz.courseId,
    });

    const isCourseManager = req.user.role === 'admin' || (quiz.courseId && canManageCourse(quiz.courseId, req.user));

    if (!isEnrolled && !isCourseManager) {
      return res.status(403).json({ message: 'You must be enrolled in this course to take this quiz.' });
    }

    const submittedCount = await QuizAttempt.countDocuments({
      user: req.user._id,
      quiz: quiz._id,
      status: 'submitted',
    });

    const activeAttempt = await QuizAttempt.findOne({
      user: req.user._id,
      quiz: quiz._id,
      status: 'in_progress',
    });

    // Mask answer keys and explanations from learners
    const sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      type: q.type || 'single_choice',
      options: q.options || [],
      points: q.points || 1,
    }));

    res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        course: quiz.courseId,
        timeLimit: quiz.timeLimit || 0,
        maxAttempts: quiz.maxAttempts || 0,
        passingScore: quiz.passingScore || 50,
        questions: sanitizedQuestions,
        questionCount: sanitizedQuestions.length,
      },
      attemptsUsed: submittedCount,
      inProgressAttempt: activeAttempt ? {
        _id: activeAttempt._id,
        startedAt: activeAttempt.startedAt,
        answers: activeAttempt.answers || [],
      } : null,
    });
  } catch (error) {
    console.error('Quiz details error:', error);
    res.status(500).json({ message: 'Error retrieving quiz details.' });
  }
});

// @route   POST /api/quizzes/:id/attempts/start
// @desc    Start or resume the single in-progress quiz attempt (Idempotent)
// @access  Private — enrolled student
router.post('/:id/attempts/start', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    if (quiz.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'This quiz is not currently available.' });
    }

    // Check course enrollment
    const isEnrolled = await Enrollment.findOne({
      userId: req.user._id,
      courseId: quiz.courseId,
      status: { $in: ['active', 'completed'] },
    }) || await Progress.findOne({
      userId: req.user._id,
      courseId: quiz.courseId,
    });

    const isCourseManager = req.user.role === 'admin' || (quiz.courseId && canManageCourse(quiz.courseId, req.user));

    if (!isEnrolled && !isCourseManager) {
      return res.status(403).json({ message: 'You must be enrolled in this course to take this quiz.' });
    }

    // Check max attempts
    const completedAttempts = await QuizAttempt.countDocuments({
      user: req.user._id,
      quiz: quiz._id,
      status: 'submitted',
    });

    if (quiz.maxAttempts && quiz.maxAttempts > 0 && completedAttempts >= quiz.maxAttempts) {
      return res.status(400).json({
        message: `Maximum attempt limit (${quiz.maxAttempts}) reached for this quiz.`,
        completedAttempts,
        maxAttempts: quiz.maxAttempts,
      });
    }

    // Find or create the single active in-progress attempt
    let attempt = await QuizAttempt.findOne({
      user: req.user._id,
      quiz: quiz._id,
      status: 'in_progress',
    });

    let isResumed = false;
    if (attempt) {
      isResumed = true;
    } else {
      attempt = await QuizAttempt.create({
        user: req.user._id,
        quiz: quiz._id,
        course: quiz.courseId,
        attemptNumber: completedAttempts + 1,
        status: 'in_progress',
        startedAt: new Date(),
      });
    }

    // Return sanitized questions
    const sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      type: q.type || 'single_choice',
      options: q.options || [],
      points: q.points || 1,
    }));

    res.status(isResumed ? 200 : 201).json({
      message: isResumed ? 'Resumed active quiz attempt.' : 'Started new quiz attempt.',
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt,
      timeLimit: quiz.timeLimit || 0,
      questions: sanitizedQuestions,
      answers: attempt.answers || [],
      isResumed,
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ message: 'Error starting quiz attempt: ' + error.message });
  }
});

// @route   GET /api/quizzes/:id/attempts
// @desc    Get user's previous submitted attempts for a quiz
// @access  Private
router.get('/:id/attempts', protect, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      user: req.user._id,
      quiz: req.params.id,
      status: 'submitted',
    })
      .sort({ submittedAt: -1 })
      .select('attemptNumber score maxScore percentage passed submittedAt durationSeconds');

    res.json({ attempts });
  } catch (error) {
    console.error('Fetch quiz attempts error:', error);
    res.status(500).json({ message: 'Error fetching attempts.' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get single quiz details with full questions for management
// @access  Private — instructor (owner) or admin
router.get('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title thumbnail category instructor instructorId')
      .populate('instructorId', 'name email');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const course = await Course.findById(quiz.courseId?._id || quiz.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to view this quiz.' });
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Error retrieving quiz.' });
  }
});

// @route   POST /api/quizzes
// @desc    Create a quiz for an instructor's course
// @access  Private — instructor (owner of course) or admin
router.post('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, courseId, lessonId, timeLimit, maxAttempts, status, passingScore, questions } = req.body;

    // 1. Title validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Quiz title is required.' });
    }

    // 2. Course validation
    if (!courseId) {
      return res.status(400).json({ message: 'Course selection is required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // 3. Ownership check: Only course owner instructor or admin
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to attach a quiz to this course.',
      });
    }

    // Optional lesson validation if provided
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson || lesson.courseId.toString() !== courseId.toString()) {
        return res.status(400).json({ message: 'Lesson does not belong to the specified course.' });
      }
    }

    // 4. Questions array validation
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required.' });
    }

    // Validate each question
    for (const [idx, q] of questions.entries()) {
      const validationError = validateQuestion(q, idx);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    const formattedQuestions = questions.map((q, idx) => formatQuestionForSave(q, idx));

    const quiz = await Quiz.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      courseId: course._id,
      instructorId: course.instructorId || req.user._id,
      lessonId: lessonId || undefined,
      timeLimit: typeof timeLimit === 'number' && timeLimit >= 0 ? timeLimit : 0,
      maxAttempts: typeof maxAttempts === 'number' && maxAttempts >= 0 ? maxAttempts : 0,
      status: ['published', 'draft', 'archived'].includes(status) ? status : 'published',
      passingScore: typeof passingScore === 'number' ? passingScore : 50,
      questions: formattedQuestions,
    });

    const populatedQuiz = await Quiz.findById(quiz._id).populate('courseId', 'title thumbnail category');

    res.status(201).json({
      message: 'Quiz created successfully.',
      quiz: populatedQuiz,
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Error creating quiz: ' + error.message });
  }
});

// @route   PUT /api/quizzes/:id
// @desc    Update an existing quiz
// @access  Private — instructor (owner) or admin
router.put('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Ownership check on current course
    const course = await Course.findById(quiz.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to edit this quiz.',
      });
    }

    const { title, description, courseId, lessonId, timeLimit, maxAttempts, status, passingScore, questions } = req.body;

    // Title validation if changed
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Quiz title cannot be empty.' });
      }
      quiz.title = title.trim();
    }

    if (description !== undefined) {
      quiz.description = description ? description.trim() : '';
    }

    if (timeLimit !== undefined) {
      quiz.timeLimit = typeof timeLimit === 'number' && timeLimit >= 0 ? timeLimit : 0;
    }

    if (maxAttempts !== undefined) {
      quiz.maxAttempts = typeof maxAttempts === 'number' && maxAttempts >= 0 ? maxAttempts : 0;
    }

    if (status !== undefined && ['published', 'draft', 'archived'].includes(status)) {
      quiz.status = status;
    }

    if (passingScore !== undefined && typeof passingScore === 'number') {
      quiz.passingScore = passingScore;
    }

    // Course reassignment validation
    if (courseId && courseId.toString() !== quiz.courseId.toString()) {
      const newCourse = await Course.findById(courseId);
      if (!newCourse) {
        return res.status(404).json({ message: 'New course not found.' });
      }
      if (!canManageCourse(newCourse, req.user)) {
        return res.status(403).json({ message: 'You do not have permission to assign to this course.' });
      }
      quiz.courseId = newCourse._id;
      quiz.instructorId = newCourse.instructorId || req.user._id;
    }

    if (lessonId !== undefined) {
      quiz.lessonId = lessonId || undefined;
    }

    // Questions validation if changed
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Quiz must have at least one question.' });
      }
      for (const [idx, q] of questions.entries()) {
        const validationError = validateQuestion(q, idx);
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }
      }
      quiz.questions = questions.map((q, idx) => formatQuestionForSave(q, idx));
    }

    await quiz.save();

    const populatedQuiz = await Quiz.findById(quiz._id).populate('courseId', 'title thumbnail category');

    res.json({
      message: 'Quiz updated successfully.',
      quiz: populatedQuiz,
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Error updating quiz: ' + error.message });
  }
});

// @route   DELETE /api/quizzes/:id
// @desc    Delete a quiz
// @access  Private — instructor (owner) or admin
router.delete('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const course = await Course.findById(quiz.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to delete this quiz.',
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Error deleting quiz.' });
  }
});

// @route   GET /api/quizzes/lesson/:lessonId
// @desc    Get quiz for a specific lesson (answers sanitized for learners)
// @access  Public / Optional Protect
router.get('/lesson/:lessonId', optionalProtect, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const quiz = await Quiz.findOne({ lessonId });

    if (!quiz) {
      return res.status(404).json({ message: 'No quiz found for this lesson.' });
    }

    const course = await Course.findById(quiz.courseId);
    const isManager = course && req.user && canManageCourse(course, req.user);

    if (isManager) {
      return res.json({ quiz });
    }

    // Learners see questions without answers
    const sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      type: q.type || 'single_choice',
      options: q.options,
    }));

    res.json({
      quiz: {
        _id: quiz._id,
        lessonId: quiz.lessonId,
        courseId: quiz.courseId,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questionCount: quiz.questions.length,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error('Fetch lesson quiz error:', error);
    res.status(500).json({ message: 'Error fetching lesson quiz.' });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit answers for a quiz assessment and receive instant score & feedback
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required.' });
    }

    let correctCount = 0;
    const feedback = quiz.questions.map((question) => {
      const submitted = answers.find(
        (a) => a.questionId?.toString() === question._id.toString()
      );

      const qType = question.type || 'single_choice';
      let isCorrect = false;

      if (qType === 'single_choice') {
        const selected = submitted ? submitted.selectedOptionIndex : null;
        isCorrect = typeof selected === 'number' && selected === question.correctOptionIndex;
      } else if (qType === 'multiple_choice') {
        const selectedArr = submitted && Array.isArray(submitted.selectedOptions)
          ? submitted.selectedOptions.map(Number).sort((a, b) => a - b)
          : [];
        const correctArr = (question.correctOptions || []).slice().sort((a, b) => a - b);
        isCorrect =
          selectedArr.length === correctArr.length &&
          selectedArr.every((val, i) => val === correctArr[i]);
      } else if (qType === 'true_false') {
        let submittedBool = null;
        if (submitted) {
          if (typeof submitted.selectedBoolean === 'boolean') {
            submittedBool = submitted.selectedBoolean;
          } else if (typeof submitted.selectedOptionIndex === 'number') {
            submittedBool = submitted.selectedOptionIndex === 0;
          }
        }
        isCorrect = submittedBool !== null && submittedBool === question.correctBoolean;
      } else if (qType === 'short_answer') {
        const textAnswer = submitted && typeof submitted.textAnswer === 'string'
          ? submitted.textAnswer.trim().toLowerCase()
          : '';
        const accepted = (question.acceptedAnswers || []).map((ans) => ans.trim().toLowerCase());
        isCorrect = textAnswer.length > 0 && accepted.includes(textAnswer);
      }

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionId: question._id,
        questionText: question.questionText,
        type: qType,
        options: question.options,
        isCorrect,
        explanation: question.explanation || '',
      };
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= (quiz.passingScore || 70);

    res.json({
      message: passed
        ? `Congratulations! You passed the quiz with ${score}%.`
        : `You scored ${score}%. A minimum of ${quiz.passingScore || 70}% is required to pass.`,
      quizId: quiz._id,
      title: quiz.title,
      totalQuestions,
      correctCount,
      score,
      passingScore: quiz.passingScore || 70,
      passed,
      feedback,
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Error grading quiz submission.' });
  }
});

export default router;

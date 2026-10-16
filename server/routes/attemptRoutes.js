import express from 'express';
import QuizAttempt from '../models/QuizAttempt.js';
import Quiz from '../models/Quiz.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/authMiddleware.js';
import { scoreAttempt } from '../utils/scoring.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

// @route   POST /api/attempts/:id/submit
// @desc    Idempotently submit a quiz attempt and score on the server
// @access  Private — enrolled student
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body;

    const existingAttempt = await QuizAttempt.findById(attemptId);
    if (!existingAttempt) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }

    // Security: Only the attempt owner can submit it
    if (existingAttempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to submit this attempt.' });
    }

    // IDEMPOTENCE (SCRUM-49 Acceptance Criterion):
    // If the attempt has already been submitted, return existing result without re-scoring or duplicate creation
    if (existingAttempt.status === 'submitted') {
      const populated = await QuizAttempt.findById(attemptId)
        .populate('quiz', 'title passingScore timeLimit maxAttempts')
        .populate('course', 'title');

      return res.json({
        message: 'Quiz attempt already submitted. Returning existing score.',
        attempt: populated,
        idempotent: true,
      });
    }

    const quiz = await Quiz.findById(existingAttempt.quiz);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz no longer exists.' });
    }

    // Check optional time limit expiration (with 30-second leeway for network latency)
    let isTimeExpired = false;
    const now = new Date();
    const durationSeconds = Math.max(0, Math.round((now.getTime() - new Date(existingAttempt.startedAt).getTime()) / 1000));

    if (quiz.timeLimit && quiz.timeLimit > 0) {
      const maxAllowedSeconds = quiz.timeLimit * 60 + 30;
      if (durationSeconds > maxAllowedSeconds) {
        isTimeExpired = true;
      }
    }

    // Pure server-side scoring
    const scored = scoreAttempt(quiz, answers);

    // Atomic update from 'in_progress' to 'submitted'
    const updatedAttempt = await QuizAttempt.findOneAndUpdate(
      {
        _id: attemptId,
        user: req.user._id,
        status: 'in_progress', // Atomic guard
      },
      {
        $set: {
          answers: scored.answers,
          score: scored.score,
          maxScore: scored.maxScore,
          percentage: scored.percentage,
          passed: scored.passed,
          status: 'submitted',
          submittedAt: now,
          durationSeconds,
        },
      },
      { new: true }
    )
      .populate('quiz', 'title passingScore timeLimit maxAttempts description')
      .populate('course', 'title');

    if (!updatedAttempt) {
      // Handled concurrent submission: fetch final
      const finalAttempt = await QuizAttempt.findById(attemptId)
        .populate('quiz', 'title passingScore timeLimit maxAttempts')
        .populate('course', 'title');
      return res.json({
        message: 'Quiz attempt submitted.',
        attempt: finalAttempt,
        idempotent: true,
      });
    }

    // Write audit log entry
    await logAuditEvent({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'QUIZ_SUBMITTED',
      targetType: 'QuizAttempt',
      targetId: updatedAttempt._id,
      after: {
        quizId: quiz._id,
        quizTitle: quiz.title,
        score: scored.score,
        maxScore: scored.maxScore,
        percentage: scored.percentage,
        passed: scored.passed,
        durationSeconds,
        timeExpired: isTimeExpired,
      },
      req,
    });

    res.json({
      message: scored.passed
        ? `Congratulations! You passed the quiz with ${scored.percentage}%.`
        : `You scored ${scored.percentage}%. The passing threshold is ${quiz.passingScore || 50}%.`,
      attempt: updatedAttempt,
      timeExpired: isTimeExpired,
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ message: 'Error submitting quiz attempt: ' + error.message });
  }
});

// @route   GET /api/attempts/:id
// @desc    Get detailed attempt outcome and answers review
// @access  Private — student owner, course instructor, or admin
router.get('/:id', protect, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('quiz', 'title description passingScore timeLimit maxAttempts questions')
      .populate('course', 'title')
      .populate('user', 'name email');

    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found.' });
    }

    const isOwner = attempt.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    let isCourseInstructor = false;
    if (req.user.role === 'instructor') {
      const course = await Course.findById(attempt.course?._id || attempt.course);
      isCourseInstructor = course && course.instructorId?.toString() === req.user._id.toString();
    }

    if (!isOwner && !isAdmin && !isCourseInstructor) {
      return res.status(403).json({ message: 'You do not have permission to view this quiz attempt.' });
    }

    // If attempt is still in progress and viewed by learner, sanitize correct answers to prevent leaks
    if (attempt.status === 'in_progress' && isOwner && !isAdmin) {
      const sanitized = attempt.toObject();
      if (Array.isArray(sanitized.answers)) {
        sanitized.answers = sanitized.answers.map((a) => {
          const { correctAnswers, explanation, ...rest } = a;
          return rest;
        });
      }
      return res.json({ attempt: sanitized });
    }

    res.json({ attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Error fetching attempt: ' + error.message });
  }
});

export default router;

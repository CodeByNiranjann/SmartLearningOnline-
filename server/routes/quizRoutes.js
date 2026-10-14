import express from 'express';
import Quiz from '../models/Quiz.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';

const router = express.Router();

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
    const isManager = course && canManageCourse(course, req.user);

    if (isManager) {
      // Instructors and Admins see full quiz including answer keys
      return res.json({ quiz });
    }

    // Learners see questions and options, but answers and explanations are masked until submission
    const sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
    }));

    res.json({
      quiz: {
        _id: quiz._id,
        lessonId: quiz.lessonId,
        courseId: quiz.courseId,
        title: quiz.title,
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

// @route   POST /api/quizzes
// @desc    Create a quiz for a lesson
// @access  Private — instructor (owner) or admin
router.post('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { lessonId, courseId, title, passingScore, questions } = req.body;

    if (!lessonId || !courseId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: 'lessonId, courseId, title, and at least one question are required.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to attach a quiz to this course.',
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.courseId.toString() !== courseId.toString()) {
      return res.status(400).json({ message: 'Lesson does not belong to the specified course.' });
    }

    // Validate each question format
    for (const [idx, q] of questions.entries()) {
      if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          message: `Question #${idx + 1} must include text and at least 2 options.`,
        });
      }
      if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        return res.status(400).json({
          message: `Question #${idx + 1} has an invalid correctOptionIndex.`,
        });
      }
    }

    // Check if quiz already exists for this lesson
    const existing = await Quiz.findOne({ lessonId });
    if (existing) {
      return res.status(400).json({
        message: 'A quiz already exists for this lesson. Use PUT to update.',
        quizId: existing._id,
      });
    }

    const quiz = await Quiz.create({
      lessonId,
      courseId,
      title: title.trim(),
      passingScore: typeof passingScore === 'number' ? passingScore : 70,
      questions,
    });

    res.status(201).json({
      message: 'Quiz created successfully.',
      quiz,
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Error creating quiz.' });
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

    const course = await Course.findById(quiz.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to edit this quiz.',
      });
    }

    const { title, passingScore, questions } = req.body;

    if (title) quiz.title = title.trim();
    if (typeof passingScore === 'number') quiz.passingScore = passingScore;

    if (Array.isArray(questions)) {
      if (questions.length === 0) {
        return res.status(400).json({ message: 'Quiz must have at least one question.' });
      }
      for (const [idx, q] of questions.entries()) {
        if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            message: `Question #${idx + 1} must include text and at least 2 options.`,
          });
        }
        if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
          return res.status(400).json({
            message: `Question #${idx + 1} has an invalid correctOptionIndex.`,
          });
        }
      }
      quiz.questions = questions;
    }

    await quiz.save();

    res.json({
      message: 'Quiz updated successfully.',
      quiz,
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Error updating quiz.' });
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

    // Evaluate answers
    let correctCount = 0;
    const feedback = quiz.questions.map((question) => {
      const submitted = answers.find(
        (a) => a.questionId?.toString() === question._id.toString()
      );
      const selectedOptionIndex = submitted ? submitted.selectedOptionIndex : null;
      const isCorrect = selectedOptionIndex === question.correctOptionIndex;

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
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

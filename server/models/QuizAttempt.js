import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionText: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'single_choice',
  },
  options: [{ type: String }],
  selectedOptions: [{ type: Number }], // array of option indices selected
  textAnswer: {
    type: String,
    default: '',
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  maxPoints: {
    type: Number,
    default: 1,
  },
  correctAnswers: [mongoose.Schema.Types.Mixed], // snapshot of correct answers
  explanation: {
    type: String,
    default: '',
  },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted'],
      default: 'in_progress',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Requirement: Unique partial index to guarantee single active in-progress attempt per user per quiz
quizAttemptSchema.index(
  { user: 1, quiz: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
  }
);

export default mongoose.model('QuizAttempt', quizAttemptSchema);

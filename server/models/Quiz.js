import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['single_choice', 'multiple_choice', 'true_false', 'short_answer'],
    default: 'single_choice',
  },
  options: [
    {
      type: String,
    },
  ],
  correctOptionIndex: {
    type: Number,
  },
  correctOptions: [
    {
      type: Number,
    },
  ],
  correctBoolean: {
    type: Boolean,
  },
  acceptedAnswers: [
    {
      type: String,
    },
  ],
  explanation: {
    type: String,
    default: '',
  },
  points: {
    type: Number,
    default: 1,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const quizSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: false,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    timeLimit: {
      type: Number, // In minutes (0 or null = no time limit)
      default: 0,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
    },
    passingScore: {
      type: Number,
      default: 50,
    },
    maxAttempts: {
      type: Number, // 0 or null = unlimited
      default: 0,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);

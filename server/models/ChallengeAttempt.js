import mongoose from 'mongoose';

const challengeAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingChallenge',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['javascript', 'python'],
      default: 'javascript',
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'in_progress'],
      default: 'in_progress',
    },
    testResults: [
      {
        testCaseIndex: { type: Number },
        passed: { type: Boolean },
        actualOutput: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        error: { type: String, default: '' },
      },
    ],
    passedCount: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number,
      default: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

challengeAttemptSchema.index({ userId: 1, challengeId: 1 });

export default mongoose.model('ChallengeAttempt', challengeAttemptSchema);

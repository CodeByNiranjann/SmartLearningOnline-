import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String, default: '' },
});

const codingChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    problemStatement: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    constraints: [
      {
        type: String,
      },
    ],
    examples: [
      {
        input: { type: String },
        output: { type: String },
        explanation: { type: String, default: '' },
      },
    ],
    testCases: [testCaseSchema],
    starterCode: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
    },
    solution: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
    },
    hints: [
      {
        type: String,
      },
    ],
    approachExplanation: {
      type: String,
      default: '',
    },
    timeComplexity: {
      type: String,
      default: '',
    },
    spaceComplexity: {
      type: String,
      default: '',
    },
    companyTags: [
      {
        type: String,
        trim: true,
      },
    ],
    points: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    solveCount: {
      type: Number,
      default: 0,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

codingChallengeSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('CodingChallenge', codingChallengeSchema);

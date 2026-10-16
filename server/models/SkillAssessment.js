import mongoose from 'mongoose';

const skillAssessmentQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Data Structures & Algorithms', 'Backend & Databases', 'System Design & Architecture'],
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true,
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
      weight: { type: Number, default: 1 },
    },
  ],
  explanation: {
    type: String,
    default: '',
  },
});

const skillAssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Placement & Skills Diagnostic Assessment',
    },
    description: {
      type: String,
      default: 'Diagnostic test evaluating your current skill level across core computer science & software engineering competencies.',
    },
    questions: [skillAssessmentQuestionSchema],
    passingThresholds: {
      intermediate: { type: Number, default: 50 },
      advanced: { type: Number, default: 80 },
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SkillAssessment', skillAssessmentSchema);

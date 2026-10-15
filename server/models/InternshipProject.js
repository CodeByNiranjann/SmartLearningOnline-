import mongoose from 'mongoose';

const internshipProjectSchema = new mongoose.Schema(
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
    detailedOverview: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
      index: true,
    },
    estimatedDuration: {
      type: String,
      required: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    tools: [
      {
        type: String,
        trim: true,
      },
    ],
    learningOutcomes: [
      {
        type: String,
      },
    ],
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
      },
    ],
    industry: {
      type: String,
      default: 'Technology',
    },
    companyType: {
      type: String,
      enum: ['Startup', 'Mid-size', 'Enterprise', 'Open Source', 'Freelance'],
      default: 'Startup',
    },
    relatedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    thumbnail: {
      type: String,
      default: '',
    },
    repositoryUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    popularity: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

internshipProjectSchema.index({ title: 'text', description: 'text', category: 'text', skills: 'text' });

export default mongoose.model('InternshipProject', internshipProjectSchema);

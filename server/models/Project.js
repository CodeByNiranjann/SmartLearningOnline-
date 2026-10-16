import mongoose from 'mongoose';

const rubricItemSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
    trim: true,
  },
  maxPoints: {
    type: Number,
    required: true,
    default: 25,
  },
  description: {
    type: String,
    default: '',
  },
});

const starterResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['github_starter', 'figma_design', 'api_spec', 'documentation', 'dataset', 'other'],
    default: 'github_starter',
  },
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    fullDescription: {
      type: String,
      default: '',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
      default: null,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Full-Stack Development',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
      index: true,
    },
    estimatedHours: {
      type: Number,
      default: 12,
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    learningObjectives: [
      {
        type: String,
      },
    ],
    deliverables: [
      {
        type: String,
      },
    ],
    prerequisites: [
      {
        type: String,
      },
    ],
    starterResources: [starterResourceSchema],
    rubric: [rubricItemSchema],
    totalPoints: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for snake_case compatibility as specified in SLP-6
projectSchema.virtual('course_id').get(function () {
  return this.courseId;
});
projectSchema.virtual('instructor_id').get(function () {
  return this.instructorId;
});
projectSchema.virtual('technology_stack').get(function () {
  return this.technologies;
});
projectSchema.virtual('required_skills').get(function () {
  return this.requiredSkills;
});
projectSchema.virtual('objectives').get(function () {
  return this.learningObjectives;
});
projectSchema.virtual('estimated_duration').get(function () {
  return this.estimatedHours;
});
projectSchema.virtual('thumbnail_url').get(function () {
  return this.thumbnail;
});

projectSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('Project', projectSchema);

import mongoose from 'mongoose';

const rubricItemSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
    trim: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 25,
    min: 1,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
});

const projectActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    problemStatement: {
      type: String,
      default: '',
      trim: true,
    },
    learningObjectives: [
      {
        type: String,
        trim: true,
      },
    ],
    instructions: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      default: 'General',
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
      index: true,
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    technologyStack: [
      {
        type: String,
        trim: true,
      },
    ],
    estimatedDuration: {
      type: String,
      default: '4 hours',
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ['individual', 'group'],
      default: 'individual',
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    deliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    maximumMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    gradingRubric: [rubricItemSchema],
    allowResubmission: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for compatibility
projectActivitySchema.virtual('courseId').get(function () {
  return this.course;
});
projectActivitySchema.virtual('moduleId').get(function () {
  return this.module;
});
projectActivitySchema.virtual('lessonId').get(function () {
  return this.lesson;
});
projectActivitySchema.virtual('trainerId').get(function () {
  return this.trainer;
});

projectActivitySchema.index({ course: 1, status: 1 });
projectActivitySchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('ProjectActivity', projectActivitySchema);

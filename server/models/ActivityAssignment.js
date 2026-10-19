import mongoose from 'mongoose';

const milestoneProgressSchema = new mongoose.Schema({
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityMilestone',
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
});

const activityAssignmentSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectActivity',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'under_review', 'needs_revision', 'completed', 'overdue'],
      default: 'not_started',
      index: true,
    },
    milestoneProgress: [milestoneProgressSchema],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index to prevent duplicate assignments for the same student & activity
activityAssignmentSchema.index({ activity: 1, student: 1 }, { unique: true });

activityAssignmentSchema.virtual('activityId').get(function () {
  return this.activity;
});
activityAssignmentSchema.virtual('studentId').get(function () {
  return this.student;
});

export default mongoose.model('ActivityAssignment', activityAssignmentSchema);

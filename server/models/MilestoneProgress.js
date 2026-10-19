import mongoose from 'mongoose';

const milestoneProgressSchema = new mongoose.Schema(
  {
    projectEnrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectEnrollment',
      required: true,
      index: true,
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectMilestone',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index: true,
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

milestoneProgressSchema.index({ projectEnrollmentId: 1, milestoneId: 1 }, { unique: true });

// Virtual aliases for snake_case compatibility
milestoneProgressSchema.virtual('project_enrollment_id').get(function () {
  return this.projectEnrollmentId;
});
milestoneProgressSchema.virtual('milestone_id').get(function () {
  return this.milestoneId;
});
milestoneProgressSchema.virtual('completed_at').get(function () {
  return this.completedAt;
});

export default mongoose.model('MilestoneProgress', milestoneProgressSchema);

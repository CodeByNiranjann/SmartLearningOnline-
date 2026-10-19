import mongoose from 'mongoose';

const projectEnrollmentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'in_review', 'completed', 'needs_revision'],
      default: 'not_started',
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
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

// Prevent duplicate active enrollments for the same student and project
projectEnrollmentSchema.index({ projectId: 1, studentId: 1 }, { unique: true });

// Virtual aliases for snake_case compatibility
projectEnrollmentSchema.virtual('project_id').get(function () {
  return this.projectId;
});
projectEnrollmentSchema.virtual('student_id').get(function () {
  return this.studentId;
});
projectEnrollmentSchema.virtual('enrolled_at').get(function () {
  return this.enrolledAt;
});
projectEnrollmentSchema.virtual('completed_at').get(function () {
  return this.completedAt;
});

export default mongoose.model('ProjectEnrollment', projectEnrollmentSchema);

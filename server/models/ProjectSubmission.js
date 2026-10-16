import mongoose from 'mongoose';

const rubricScoreSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
    min: 0,
  },
  feedback: {
    type: String,
    default: '',
  },
});

const fileReferenceSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
  },
  mimeType: {
    type: String,
  },
});

const projectSubmissionSchema = new mongoose.Schema(
  {
    projectEnrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectEnrollment',
      index: true,
      default: null,
    },
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
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectMilestone',
      index: true,
      default: null,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
      default: null,
    },
    // Description / Notes
    description: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    // Deliverable links
    repositoryUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    demoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    liveDemoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Deliverable uploaded file
    fileReference: {
      type: fileReferenceSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'graded', 'needs_revision'],
      default: 'submitted',
      index: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    marksAwarded: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
      default: '',
    },
    rubricScores: [rubricScoreSchema],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    resubmittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save synchronization for dual-naming fields
projectSubmissionSchema.pre('save', function (next) {
  if (this.repositoryUrl && !this.githubUrl) {
    this.githubUrl = this.repositoryUrl;
  } else if (this.githubUrl && !this.repositoryUrl) {
    this.repositoryUrl = this.githubUrl;
  }

  if (this.demoUrl && !this.liveDemoUrl) {
    this.liveDemoUrl = this.demoUrl;
  } else if (this.liveDemoUrl && !this.demoUrl) {
    this.demoUrl = this.liveDemoUrl;
  }

  if (this.description && !this.notes) {
    this.notes = this.description;
  } else if (this.notes && !this.description) {
    this.description = this.notes;
  }

  if (this.marksAwarded !== undefined && this.grade === undefined) {
    this.grade = this.marksAwarded;
  } else if (this.grade !== undefined && this.marksAwarded === undefined) {
    this.marksAwarded = this.grade;
  }

  next();
});

// Virtual aliases for snake_case compatibility
projectSubmissionSchema.virtual('project_enrollment_id').get(function () {
  return this.projectEnrollmentId;
});
projectSubmissionSchema.virtual('milestone_id').get(function () {
  return this.milestoneId;
});
projectSubmissionSchema.virtual('repository_url').get(function () {
  return this.repositoryUrl || this.githubUrl;
});
projectSubmissionSchema.virtual('demo_url').get(function () {
  return this.demoUrl || this.liveDemoUrl;
});
projectSubmissionSchema.virtual('file_reference').get(function () {
  return this.fileReference;
});
projectSubmissionSchema.virtual('submitted_at').get(function () {
  return this.submittedAt;
});
projectSubmissionSchema.virtual('reviewed_by').get(function () {
  return this.reviewedBy;
});
projectSubmissionSchema.virtual('reviewed_at').get(function () {
  return this.reviewedAt;
});
projectSubmissionSchema.virtual('marks_awarded').get(function () {
  return this.marksAwarded ?? this.grade;
});

projectSubmissionSchema.index({ projectId: 1, studentId: 1, milestoneId: 1 });

export default mongoose.model('ProjectSubmission', projectSubmissionSchema);

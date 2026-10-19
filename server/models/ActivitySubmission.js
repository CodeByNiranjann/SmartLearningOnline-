import mongoose from 'mongoose';

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

const rubricScoreSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
  },
  feedback: {
    type: String,
    default: '',
    trim: true,
  },
});

const activitySubmissionSchema = new mongoose.Schema(
  {
    activityAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActivityAssignment',
      required: true,
      index: true,
    },
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
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActivityMilestone',
      default: null,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    textResponse: {
      type: String,
      default: '',
      trim: true,
    },
    repositoryUrl: {
      type: String,
      default: '',
      trim: true,
    },
    demoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    fileReferences: [fileReferenceSchema],
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'needs_revision', 'completed'],
      default: 'submitted',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    marksAwarded: {
      type: Number,
      default: null,
    },
    trainerFeedback: {
      type: String,
      default: '',
      trim: true,
    },
    rubricScores: [rubricScoreSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activitySubmissionSchema.index({ activityAssignment: 1, attemptNumber: 1 });
activitySubmissionSchema.index({ activity: 1, student: 1 });

export default mongoose.model('ActivitySubmission', activitySubmissionSchema);

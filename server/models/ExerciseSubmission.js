import mongoose from 'mongoose';

const fileReferenceSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  storageKey: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: 'Document',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const submissionAttemptSchema = new mongoose.Schema({
  attemptNumber: {
    type: Number,
    required: true,
  },
  textAnswer: {
    type: String,
    default: null,
  },
  fileReference: {
    type: fileReferenceSchema,
    default: null,
  },
  submissionStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Submitted', 'Under Review', 'Accepted', 'Needs Revision'],
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  marksAwarded: {
    type: Number,
    default: null,
  },
  reviewerFeedback: {
    type: String,
    default: null,
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
});

const exerciseSubmissionSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticalExercise',
      required: true,
      index: true,
    },
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    textAnswer: {
      type: String,
      default: null,
    },
    fileReference: {
      type: fileReferenceSchema,
      default: null,
    },
    submissionStatus: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Submitted', 'Under Review', 'Accepted', 'Needs Revision'],
      default: 'Submitted',
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    marksAwarded: {
      type: Number,
      default: null,
      min: 0,
    },
    reviewerFeedback: {
      type: String,
      default: null,
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
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    history: [submissionAttemptSchema],
  },
  { timestamps: true }
);

// Enforce unique active submission per (exerciseId, learnerId)
exerciseSubmissionSchema.index({ exerciseId: 1, learnerId: 1 }, { unique: true });
exerciseSubmissionSchema.index({ exerciseId: 1, submissionStatus: 1 });

export default mongoose.model('ExerciseSubmission', exerciseSubmissionSchema);

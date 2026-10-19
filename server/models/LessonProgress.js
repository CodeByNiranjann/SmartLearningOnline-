import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true,
    },
    lastPositionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: {
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
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        ret.enrollment_id = ret.enrollmentId;
        ret.lesson_id = ret.lessonId;
        ret.last_position_seconds = ret.lastPositionSeconds;
        ret.duration_seconds = ret.durationSeconds;
        ret.progress_percentage = ret.progressPercentage;
        ret.started_at = ret.startedAt;
        ret.last_accessed_at = ret.lastAccessedAt;
        ret.completed_at = ret.completedAt;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        ret.enrollment_id = ret.enrollmentId;
        ret.lesson_id = ret.lessonId;
        ret.last_position_seconds = ret.lastPositionSeconds;
        ret.duration_seconds = ret.durationSeconds;
        ret.progress_percentage = ret.progressPercentage;
        ret.started_at = ret.startedAt;
        ret.last_accessed_at = ret.lastAccessedAt;
        ret.completed_at = ret.completedAt;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        return ret;
      },
    },
  }
);

// Ensure strict uniqueness on (enrollmentId, lessonId)
lessonProgressSchema.index({ enrollmentId: 1, lessonId: 1 }, { unique: true });

// Virtual aliases for snake_case compatibility
lessonProgressSchema
  .virtual('enrollment_id')
  .get(function () {
    return this.enrollmentId;
  })
  .set(function (val) {
    this.enrollmentId = val;
  });

lessonProgressSchema
  .virtual('lesson_id')
  .get(function () {
    return this.lessonId;
  })
  .set(function (val) {
    this.lessonId = val;
  });

lessonProgressSchema
  .virtual('last_position_seconds')
  .get(function () {
    return this.lastPositionSeconds;
  })
  .set(function (val) {
    this.lastPositionSeconds = val;
  });

lessonProgressSchema
  .virtual('duration_seconds')
  .get(function () {
    return this.durationSeconds;
  })
  .set(function (val) {
    this.durationSeconds = val;
  });

lessonProgressSchema
  .virtual('progress_percentage')
  .get(function () {
    return this.progressPercentage;
  })
  .set(function (val) {
    this.progressPercentage = val;
  });

lessonProgressSchema
  .virtual('started_at')
  .get(function () {
    return this.startedAt;
  })
  .set(function (val) {
    this.startedAt = val;
  });

lessonProgressSchema
  .virtual('last_accessed_at')
  .get(function () {
    return this.lastAccessedAt;
  })
  .set(function (val) {
    this.lastAccessedAt = val;
  });

lessonProgressSchema
  .virtual('completed_at')
  .get(function () {
    return this.completedAt;
  })
  .set(function (val) {
    this.completedAt = val;
  });

lessonProgressSchema.virtual('created_at').get(function () {
  return this.createdAt;
});

lessonProgressSchema.virtual('updated_at').get(function () {
  return this.updatedAt;
});

export default mongoose.model('LessonProgress', lessonProgressSchema);

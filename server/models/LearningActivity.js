import mongoose from 'mongoose';

const learningActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD' formatted date string
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lessonsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    coursesStudied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One activity entry per user per day
learningActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('LearningActivity', learningActivitySchema);

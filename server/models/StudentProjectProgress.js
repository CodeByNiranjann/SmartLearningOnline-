import mongoose from 'mongoose';

const studentProjectProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipProject',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    completedMilestones: [
      {
        type: Number,
      },
    ],
    progressPercentage: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    repositoryUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

studentProjectProgressSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export default mongoose.model('StudentProjectProgress', studentProjectProgressSchema);

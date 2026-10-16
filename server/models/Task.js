import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskType: {
      type: String,
      enum: ['text_submission', 'link_submission', 'file_submission', 'mixed'],
      default: 'mixed',
    },
    maxPoints: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      default: 100,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    allowLateSubmissions: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ course: 1, status: 1 });
taskSchema.index({ instructor: 1, status: 1 });

export default mongoose.model('Task', taskSchema);

import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  content: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  duration: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    default: 1,
  },
}, { timestamps: true });

lessonSchema.index({ moduleId: 1, order: 1 });
lessonSchema.index({ courseId: 1 });

export default mongoose.model('Lesson', lessonSchema);

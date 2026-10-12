import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Video', 'Article', 'Documentation', 'PDF', 'GitHub', 'Notes', 'Website'],
    required: true,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
});

resourceSchema.index({ lessonId: 1 });

export default mongoose.model('Resource', resourceSchema);

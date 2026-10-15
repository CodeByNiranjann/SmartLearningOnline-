import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      trim: true,
    },
    storedFilename: {
      type: String,
      trim: true,
    },
    fileExtension: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: [
        'PDF',
        'Document',
        'Presentation',
        'Image',
        'Video',
        'Text',
        'Article',
        'Documentation',
        'GitHub',
        'Notes',
        'Website',
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    thumbnail: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Resource', resourceSchema);

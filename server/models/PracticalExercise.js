import mongoose from 'mongoose';

const referenceMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
});

const practicalExerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    learningObjectives: [
      {
        type: String,
        trim: true,
      },
    ],
    instructions: {
      type: String,
      required: true,
    },
    exerciseType: {
      type: String,
      enum: ['Text Answer', 'File Upload', 'Coding Exercise', 'Project Task'],
      default: 'Coding Exercise',
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
      required: true,
      index: true,
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
      min: 5,
    },
    maximumMarks: {
      type: Number,
      default: 100,
      min: 1,
    },
    passingMarks: {
      type: Number,
      default: 70,
      min: 1,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referenceMaterials: [referenceMaterialSchema],
    experimentFile: {
      originalName: { type: String, default: null },
      storageKey: { type: String, default: null },
      mimeType: { type: String, default: null },
      fileSize: { type: Number, default: null },
      url: { type: String, default: null },
    },
    starterCode: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Published',
      index: true,
    },
  },
  { timestamps: true }
);

practicalExerciseSchema.index({ title: 'text', description: 'text' });
practicalExerciseSchema.index({ courseId: 1, status: 1 });
practicalExerciseSchema.index({ lessonId: 1, status: 1 });

export default mongoose.model('PracticalExercise', practicalExerciseSchema);

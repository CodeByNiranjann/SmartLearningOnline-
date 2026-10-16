import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      default: '',
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    twoFactorBackupCodes: [
      {
        code: { type: String },
        used: { type: Boolean, default: false },
      },
    ],
    // SLP-14: Skill level assessment & personalization profile
    skillProfile: {
      overallLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
      },
      assessmentCompleted: {
        type: Boolean,
        default: false,
      },
      lastAssessedAt: {
        type: Date,
      },
      categoryLevels: [
        {
          category: { type: String, required: true },
          level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner',
          },
          score: { type: Number, default: 0 },
        },
      ],
      targetGoal: {
        type: String,
        default: 'Placement Preparation & Practical Projects',
      },
      preferredPace: {
        type: String,
        enum: ['Gentle', 'Balanced', 'Intensive'],
        default: 'Balanced',
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);


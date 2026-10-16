import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import Enrollment from './models/Enrollment.js';
import Progress from './models/Progress.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  headline: { type: String, default: '' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  isTwoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  twoFactorBackupCodes: [{ code: { type: String }, used: { type: Boolean, default: false } }],
  skillProfile: {
    overallLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    assessmentCompleted: { type: Boolean, default: false },
    lastAssessedAt: { type: Date },
    categoryLevels: [{ category: { type: String, required: true }, level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' }, score: { type: Number, default: 0 } }],
    targetGoal: { type: String, default: 'Placement Preparation & Practical Projects' },
    preferredPace: { type: String, enum: ['Gentle', 'Balanced', 'Intensive'], default: 'Balanced' },
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const students = [
  { name: 'John Student',   email: 'student1@example.com', password: 'Password123!' },
  { name: 'Jane Learner',   email: 'student2@example.com', password: 'SecurePass456$' },
  { name: 'Alex Scholar',   email: 'student3@example.com', password: 'MySecret789#' },
];

async function seedStudents() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    let mainStudent = null;

    for (const s of students) {
      const hashedPassword = await bcrypt.hash(s.password, 10);
      const user = await User.findOneAndUpdate(
        { email: s.email },
        {
          $set: {
            name: s.name,
            email: s.email,
            password: hashedPassword,
            role: 'student',
            isTwoFactorEnabled: false,
            headline: 'Aspiring Full Stack Engineer',
            bio: 'Passionate about modern web development, algorithms, and cloud technologies.',
            'skillProfile.overallLevel': 'Intermediate',
            'skillProfile.assessmentCompleted': true,
            'skillProfile.lastAssessedAt': new Date(),
            'skillProfile.categoryLevels': [
              { category: 'Web Development', level: 'Intermediate', score: 75 },
              { category: 'Data Structures', level: 'Beginner', score: 55 },
              { category: 'Algorithms', level: 'Intermediate', score: 70 },
            ],
            'skillProfile.targetGoal': 'Placement Preparation & Practical Projects',
            'skillProfile.preferredPace': 'Balanced',
          },
        },
        { upsert: true, new: true }
      );

      if (s.email === 'student1@example.com') {
        mainStudent = user;
      }
      console.log(`  ✓ Synced Student: ${s.email} / ${s.password}`);
    }

    // Seed enrollments & realistic progress for student1 so Dashboard UI looks rich
    if (mainStudent) {
      const courses = await Course.find({});
      if (courses.length > 0) {
        for (let i = 0; i < Math.min(2, courses.length); i++) {
          const course = courses[i];
          
          await Enrollment.findOneAndUpdate(
            { userId: mainStudent._id, courseId: course._id },
            { $set: { status: 'active', enrolledAt: new Date(Date.now() - 7 * 86400000) } },
            { upsert: true }
          );

          // Find lessons for this course
          const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
          let allLessons = [];
          for (const m of modules) {
            const lessons = await Lesson.find({ moduleId: m._id }).sort({ order: 1 });
            allLessons = allLessons.concat(lessons);
          }

          const completedCount = i === 0 ? Math.ceil(allLessons.length * 0.5) : Math.ceil(allLessons.length * 0.25);
          const completedLessons = allLessons.slice(0, completedCount).map((l) => l._id);
          const currentLesson = allLessons[completedCount] ? allLessons[completedCount]._id : (allLessons[0]?._id || null);
          const progressPercentage = allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0;

          await Progress.findOneAndUpdate(
            { userId: mainStudent._id, courseId: course._id },
            {
              $set: {
                completedLessons,
                currentLesson,
                lastAccessedLesson: currentLesson,
                progressPercentage,
                lastAccessedAt: new Date(),
              },
            },
            { upsert: true }
          );

          console.log(`  ✓ Enrolled in "${course.title}" with ${progressPercentage}% progress`);
        }
      }
    }

    console.log('\n=== Fake Student Credentials ===');
    console.log('  Email:    student1@example.com');
    console.log('  Password: Password123!');
    console.log('================================\n');

    await mongoose.disconnect();
    console.log('Done! You can now log in with student1@example.com / Password123!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedStudents();


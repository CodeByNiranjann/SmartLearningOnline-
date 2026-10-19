import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Enrollment from './models/Enrollment.js';
import Progress from './models/Progress.js';
import LessonProgress from './models/LessonProgress.js';
import Lesson from './models/Lesson.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';

export async function migrateLessonProgress() {
  console.log('🔄 Starting LessonProgress database migration...');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGO_URI);
  }

  // Ensure compound index is created
  await LessonProgress.syncIndexes();

  const enrollments = await Enrollment.find({});
  console.log(`Found ${enrollments.length} total enrollments to inspect.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const enrollment of enrollments) {
    const { userId, courseId, _id: enrollmentId } = enrollment;

    // Find progress record for this student and course
    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      skippedCount++;
      continue;
    }

    const completedLessonIds = (progress.completedLessons || []).map((id) => id.toString());
    const playbackRecords = progress.playbackProgress || [];

    // 1. Migrate completed lessons
    for (const lessonIdStr of completedLessonIds) {
      const lesson = await Lesson.findById(lessonIdStr);
      if (!lesson || lesson.courseId.toString() !== courseId.toString()) continue;

      const pb = playbackRecords.find((p) => p.lessonId?.toString() === lessonIdStr);
      const played = pb ? pb.playedSeconds || 0 : 0;
      const duration = pb ? pb.durationSeconds || 0 : 0;

      await LessonProgress.findOneAndUpdate(
        { enrollmentId, lessonId: lesson._id },
        {
          $set: {
            enrollmentId,
            lessonId: lesson._id,
            status: 'COMPLETED',
            lastPositionSeconds: played,
            durationSeconds: duration,
            progressPercentage: 100,
            completedAt: pb?.lastWatchedAt || progress.updatedAt || new Date(),
            lastAccessedAt: pb?.lastWatchedAt || progress.lastAccessedAt || new Date(),
          },
          $setOnInsert: {
            startedAt: progress.createdAt || new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      migratedCount++;
    }

    // 2. Migrate in-progress playback records
    for (const pb of playbackRecords) {
      const lessonIdStr = pb.lessonId?.toString();
      if (!lessonIdStr || completedLessonIds.includes(lessonIdStr)) continue;

      const lesson = await Lesson.findById(lessonIdStr);
      if (!lesson || lesson.courseId.toString() !== courseId.toString()) continue;

      const played = Math.max(0, pb.playedSeconds || 0);
      const duration = Math.max(0, pb.durationSeconds || 0);
      const isComplete = Boolean(pb.completed) || (duration > 0 && played >= duration * 0.9);
      const percentage = duration > 0 ? Math.min(100, Math.round((played / duration) * 100)) : (isComplete ? 100 : 0);

      await LessonProgress.findOneAndUpdate(
        { enrollmentId, lessonId: lesson._id },
        {
          $set: {
            enrollmentId,
            lessonId: lesson._id,
            status: isComplete ? 'COMPLETED' : played > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
            lastPositionSeconds: played,
            durationSeconds: duration,
            progressPercentage: percentage,
            completedAt: isComplete ? pb.lastWatchedAt || new Date() : null,
            lastAccessedAt: pb.lastWatchedAt || new Date(),
          },
          $setOnInsert: {
            startedAt: pb.lastWatchedAt || new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      migratedCount++;
    }
  }

  console.log(`✅ Migration complete. Migrated/updated ${migratedCount} lesson progress records across ${enrollments.length} enrollments.`);
  return { migratedCount, totalEnrollments: enrollments.length };
}

if (process.argv[1]?.endsWith('migrateLessonProgress.js')) {
  migrateLessonProgress()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

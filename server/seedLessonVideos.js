import mongoose from 'mongoose';
import Lesson from './models/Lesson.js';
import Course from './models/Course.js';

const YOUTUBE_VIDEOS = [
  'https://www.youtube.com/watch?v=bMknfKXIFA8', // React Beginner Full Course
  'https://www.youtube.com/watch?v=W6NZfCO5SIk', // JavaScript Full Course
  'https://www.youtube.com/watch?v=9SGDpanrc8U', // Spring Boot Full Course
  'https://www.youtube.com/watch?v=RBSGKlAnoiM', // Data Structures and Algorithms
  'https://www.youtube.com/watch?v=843NEC-IvW0', // Next.js Tutorial
  'https://www.youtube.com/watch?v=rfscVS0vtbw', // Python Programming
  'https://www.youtube.com/watch?v=pg19Z8LL06w', // Docker & Containers
  'https://www.youtube.com/watch?v=3Kq1MIfTWCE', // Ethical Hacking & Security
];

async function seedVideos() {
  await mongoose.connect('mongodb://127.0.0.1:27017/online-learning');
  console.log('Connected to MongoDB.');

  const lessons = await Lesson.find({});
  console.log(`Found ${lessons.length} lessons to check/update.`);

  let updatedCount = 0;
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    // Assign a YouTube video based on index or title
    const videoUrl = YOUTUBE_VIDEOS[i % YOUTUBE_VIDEOS.length];
    lesson.videoUrl = videoUrl;
    lesson.duration = `${10 + (i % 25)} min`;
    await lesson.save();
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} lessons with YouTube video URLs and durations.`);
  process.exit(0);
}

seedVideos().catch((err) => {
  console.error('Error seeding videos:', err);
  process.exit(1);
});

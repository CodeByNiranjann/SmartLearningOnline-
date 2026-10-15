import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import CodingChallenge from '../models/CodingChallenge.js';
import ChallengeAttempt from '../models/ChallengeAttempt.js';
import InternshipProject from '../models/InternshipProject.js';
import StudentProjectProgress from '../models/StudentProjectProgress.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── GET /api/recommendations/personalized ──────────────────────────────────
// @desc    Comprehensive personalized learning recommendations engine
//          Answers "What should I learn next?" across courses, coding challenges, and projects
// @access  Private
router.get('/personalized', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // 1. Fetch user context: enrollments, progress, attempts, project progress
    const [enrollments, progressList, attempts, projectProgressList] = await Promise.all([
      Enrollment.find({ userId }).populate('courseId'),
      Progress.find({ userId }).populate('courseId').populate('currentLesson'),
      ChallengeAttempt.find({ userId }).populate('challengeId'),
      StudentProjectProgress.find({ userId }).populate('projectId'),
    ]);

    const enrolledCourseIds = enrollments
      .filter((e) => e.courseId)
      .map((e) => e.courseId._id.toString());

    // Completed courses
    const completedCourseIds = progressList
      .filter((p) => p.progressPercentage === 100 && p.courseId)
      .map((p) => p.courseId._id.toString());

    // In-progress courses
    const inProgressList = progressList
      .filter((p) => p.progressPercentage > 0 && p.progressPercentage < 100 && p.courseId);

    // Categories and tags user has engaged with
    const activeCategories = new Set();
    const activeTags = new Set();

    enrollments.forEach((e) => {
      if (e.courseId) {
        if (e.courseId.category) activeCategories.add(e.courseId.category);
        if (Array.isArray(e.courseId.tags)) {
          e.courseId.tags.forEach((t) => activeTags.add(t));
        }
      }
    });

    const studentSkillLevel = user.skillProfile?.overallLevel || 'Beginner';

    // 2. Identify "What to Learn Next" Immediate Action
    let immediateNextAction = null;

    if (inProgressList.length > 0) {
      // Pick the course with highest progress (closest to completion)
      const sortedInProgress = [...inProgressList].sort((a, b) => b.progressPercentage - a.progressPercentage);
      const topCourse = sortedInProgress[0];

      immediateNextAction = {
        type: 'continue_course',
        title: `Continue: ${topCourse.courseId.title}`,
        subtitle: topCourse.currentLesson ? `Next lesson: ${topCourse.currentLesson.title}` : 'Pick up where you left off',
        progress: topCourse.progressPercentage,
        link: topCourse.currentLesson
          ? `/learning/${topCourse.courseId._id}/${topCourse.currentLesson._id}`
          : `/courses/${topCourse.courseId._id}`,
        badge: 'In Progress · 80% to next milestone',
        reason: 'You are already making steady progress on this curriculum',
      };
    } else if (enrollments.length > 0 && enrollments[0].courseId) {
      const firstCourse = enrollments[0].courseId;
      immediateNextAction = {
        type: 'start_course',
        title: `Start Course: ${firstCourse.title}`,
        subtitle: 'First lesson ready',
        progress: 0,
        link: `/courses/${firstCourse._id}`,
        badge: 'Ready to Start',
        reason: 'Enrolled but not yet started',
      };
    }

    // 3. Recommended Next Courses
    // Rule: Match user categories or prerequisite skill advancement, exclude already enrolled
    const courseQuery = {
      _id: { $nin: enrolledCourseIds },
      status: 'published',
    };

    let recommendedCourses = [];
    if (activeCategories.size > 0) {
      recommendedCourses = await Course.find({
        ...courseQuery,
        category: { $in: Array.from(activeCategories) },
      }).limit(4);
    }

    // Fallback if user has no enrollments or few matches
    if (recommendedCourses.length < 4) {
      const fallback = await Course.find({
        ...courseQuery,
        _id: { $nin: recommendedCourses.map((c) => c._id) },
      })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(4 - recommendedCourses.length);
      recommendedCourses = [...recommendedCourses, ...fallback];
    }

    const annotatedCourses = recommendedCourses.map((course) => {
      let reason = 'Popular course for career acceleration';
      if (activeCategories.has(course.category)) {
        reason = `Matches your focus in ${course.category}`;
      } else if (course.difficulty === studentSkillLevel) {
        reason = `Calibrated for your ${studentSkillLevel} skill tier`;
      }
      return {
        ...course.toObject(),
        recommendationReason: reason,
      };
    });

    // 4. Recommended Next Coding Challenge
    const solvedChallengeIds = attempts
      .filter((a) => a.status === 'accepted' && a.challengeId)
      .map((a) => a.challengeId._id.toString());

    let targetDiff = ['Easy'];
    if (studentSkillLevel === 'Intermediate') targetDiff = ['Easy', 'Medium'];
    if (studentSkillLevel === 'Advanced') targetDiff = ['Medium', 'Hard'];

    const nextChallenges = await CodingChallenge.find({
      _id: { $nin: solvedChallengeIds },
      status: 'active',
      difficulty: { $in: targetDiff },
    })
      .select('title description category difficulty tags points companyTags')
      .limit(3);

    const annotatedChallenges = nextChallenges.map((ch) => ({
      ...ch.toObject(),
      recommendationReason: ch.companyTags?.length > 0
        ? `Interview favorite at ${ch.companyTags[0]}`
        : `Recommended ${ch.difficulty} drill for ${studentSkillLevel} learners`,
    }));

    // 5. Recommended Next Hands-on Internship Project
    const startedProjectIds = projectProgressList
      .filter((p) => p.projectId)
      .map((p) => p.projectId._id.toString());

    const nextProjects = await InternshipProject.find({
      _id: { $nin: startedProjectIds },
      status: 'active',
    })
      .select('title description category difficulty skills estimatedHours companyContext')
      .limit(2);

    const annotatedProjects = nextProjects.map((p) => ({
      ...p.toObject(),
      recommendationReason: `Real-world portfolio builder in ${p.category}`,
    }));

    // 6. Skill Gap / Personalization Insights
    const insights = {
      skillLevel: studentSkillLevel,
      targetGoal: user.skillProfile?.targetGoal || 'Placement Preparation & Practical Projects',
      enrolledCount: enrolledCourseIds.length,
      completedCount: completedCourseIds.length,
      challengesSolved: solvedChallengeIds.length,
      primaryFocus: activeCategories.size > 0 ? Array.from(activeCategories)[0] : 'Full-Stack Development',
    };

    res.json({
      immediateNextAction,
      insights,
      nextCourses: annotatedCourses,
      nextChallenges: annotatedChallenges,
      nextProjects: annotatedProjects,
    });
  } catch (error) {
    console.error('Fetch personalized recommendations error:', error);
    res.status(500).json({ message: 'Error generating personalized learning recommendations' });
  }
});

export default router;

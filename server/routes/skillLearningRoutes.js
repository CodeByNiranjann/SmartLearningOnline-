import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import InternshipProject from '../models/InternshipProject.js';
import CodingChallenge from '../models/CodingChallenge.js';
import ChallengeAttempt from '../models/ChallengeAttempt.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import SkillAssessment from '../models/SkillAssessment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── GET /api/skill-learning/profile ──────────────────────────────────────────
// @desc    Get user's current skill profile, assessed levels, and curriculum readiness
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email role skillProfile');
    
    // Check if default needs setting
    const profile = user.skillProfile || {
      overallLevel: 'Beginner',
      assessmentCompleted: false,
      categoryLevels: [],
      targetGoal: 'Placement Preparation & Practical Projects',
      preferredPace: 'Balanced',
    };

    res.json({
      name: user.name,
      skillProfile: profile,
    });
  } catch (error) {
    console.error('Fetch skill profile error:', error);
    res.status(500).json({ message: 'Error fetching skill profile' });
  }
});

// ─── PUT /api/skill-learning/profile ──────────────────────────────────────────
// @desc    Update self-declared skill level, goals, and preferred learning pace
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { overallLevel, targetGoal, preferredPace, categoryLevels } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.skillProfile) {
      user.skillProfile = {};
    }

    if (overallLevel) user.skillProfile.overallLevel = overallLevel;
    if (targetGoal) user.skillProfile.targetGoal = targetGoal;
    if (preferredPace) user.skillProfile.preferredPace = preferredPace;
    if (categoryLevels) user.skillProfile.categoryLevels = categoryLevels;

    await user.save();

    res.json({
      message: 'Skill profile updated successfully',
      skillProfile: user.skillProfile,
    });
  } catch (error) {
    console.error('Update skill profile error:', error);
    res.status(500).json({ message: 'Error updating skill profile' });
  }
});

// ─── GET /api/skill-learning/assessment ───────────────────────────────────────
// @desc    Get diagnostic assessment questions (omitting correct answers for testing)
// @access  Private
router.get('/assessment', protect, async (req, res) => {
  try {
    let assessment = await SkillAssessment.findOne({ status: 'active' });
    if (!assessment) {
      return res.status(404).json({ message: 'No active skill assessment found' });
    }

    // Sanitize questions: strip isCorrect
    const sanitizedQuestions = assessment.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options.map((opt, idx) => ({
        index: idx,
        text: opt.text,
      })),
    }));

    res.json({
      assessmentId: assessment._id,
      title: assessment.title,
      description: assessment.description,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('Fetch assessment error:', error);
    res.status(500).json({ message: 'Error fetching assessment' });
  }
});

// ─── POST /api/skill-learning/assessment/submit ──────────────────────────────
// @desc    Submit diagnostic assessment, calculate category & overall skill level
// @access  Private
router.post('/assessment/submit', protect, async (req, res) => {
  try {
    const { assessmentId, answers } = req.body;
    // answers format: { [questionId]: selectedOptionIndex }

    const assessment = await SkillAssessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const categoryScores = {};
    const categoryTotals = {};

    let totalPoints = 0;
    let maxPoints = 0;

    assessment.questions.forEach((q) => {
      const cat = q.category;
      if (!categoryScores[cat]) {
        categoryScores[cat] = 0;
        categoryTotals[cat] = 0;
      }

      // Weight based on question difficulty: Beginner = 1, Intermediate = 2, Advanced = 3
      const weight = q.difficulty === 'Advanced' ? 3 : q.difficulty === 'Intermediate' ? 2 : 1;
      categoryTotals[cat] += weight;
      maxPoints += weight;

      const userAnsIndex = answers[q._id.toString()];
      if (userAnsIndex !== undefined) {
        const chosenOpt = q.options[userAnsIndex];
        if (chosenOpt && chosenOpt.isCorrect) {
          categoryScores[cat] += weight;
          totalPoints += weight;
        }
      }
    });

    const overallPct = Math.round((totalPoints / Math.max(1, maxPoints)) * 100);

    let calculatedLevel = 'Beginner';
    if (overallPct >= assessment.passingThresholds.advanced) {
      calculatedLevel = 'Advanced';
    } else if (overallPct >= assessment.passingThresholds.intermediate) {
      calculatedLevel = 'Intermediate';
    }

    const categoryLevels = Object.keys(categoryTotals).map((cat) => {
      const pct = Math.round((categoryScores[cat] / Math.max(1, categoryTotals[cat])) * 100);
      let lvl = 'Beginner';
      if (pct >= 80) lvl = 'Advanced';
      else if (pct >= 50) lvl = 'Intermediate';

      return {
        category: cat,
        level: lvl,
        score: pct,
      };
    });

    // Update user's profile
    const user = await User.findById(req.user._id);
    user.skillProfile = {
      overallLevel: calculatedLevel,
      assessmentCompleted: true,
      lastAssessedAt: new Date(),
      categoryLevels,
      targetGoal: user.skillProfile?.targetGoal || 'Placement Preparation & Practical Projects',
      preferredPace: user.skillProfile?.preferredPace || 'Balanced',
    };
    await user.save();

    res.json({
      message: 'Assessment completed successfully',
      overallScore: overallPct,
      calculatedLevel,
      categoryLevels,
      skillProfile: user.skillProfile,
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ message: 'Error evaluating skill assessment' });
  }
});

// ─── GET /api/skill-learning/activities ───────────────────────────────────────
// @desc    Get tailored learning activities (courses, coding challenges, projects)
//          specifically matched to the student's assessed skill level
// @access  Private
router.get('/activities', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userLevel = user.skillProfile?.overallLevel || 'Beginner';

    // Map user skill level to compatible tiers
    // Beginner gets Beginner + foundational Intermediate
    // Intermediate gets Intermediate + select Advanced challenges
    // Advanced gets Advanced + complex Capstone projects
    let compatibleLevels = [userLevel];
    if (userLevel === 'Beginner') {
      compatibleLevels = ['Beginner'];
    } else if (userLevel === 'Intermediate') {
      compatibleLevels = ['Beginner', 'Intermediate'];
    } else {
      compatibleLevels = ['Intermediate', 'Advanced'];
    }

    // 1. Matched Courses
    const courses = await Course.find({
      status: 'published',
      difficulty: { $in: compatibleLevels },
    })
      .select('title description category difficulty thumbnail duration rating tags')
      .limit(6);

    // 2. Matched Coding Challenges
    // If Beginner -> 'Easy', Intermediate -> 'Easy' & 'Medium', Advanced -> 'Medium' & 'Hard'
    let challengeDiffs = ['Easy'];
    if (userLevel === 'Intermediate') challengeDiffs = ['Easy', 'Medium'];
    if (userLevel === 'Advanced') challengeDiffs = ['Medium', 'Hard'];

    const challenges = await CodingChallenge.find({
      status: 'active',
      difficulty: { $in: challengeDiffs },
    })
      .select('title description category difficulty tags points companyTags')
      .limit(6);

    // 3. Matched Hands-on Internship Projects
    const projects = await InternshipProject.find({
      status: 'active',
      difficulty: { $in: compatibleLevels },
    })
      .select('title description category difficulty skills estimatedHours companyContext')
      .limit(4);

    // 4. Learning Path Milestones recommendation
    const learningPath = [
      {
        step: 1,
        title: userLevel === 'Beginner' ? 'Core Fundamentals & Syntax' : userLevel === 'Intermediate' ? 'Design Patterns & Performance' : 'System Architecture & Optimization',
        description: `Curated learning module tailored for ${userLevel} students.`,
        type: 'Course Module',
        difficulty: userLevel,
      },
      {
        step: 2,
        title: userLevel === 'Beginner' ? 'Fundamental Algorithm Drills' : userLevel === 'Intermediate' ? 'Data Structure Optimization' : 'Hard FAANG Interview Simulations',
        description: `Coding challenges calibrated to your level to cement concepts.`,
        type: 'Coding Practice',
        difficulty: userLevel,
      },
      {
        step: 3,
        title: userLevel === 'Beginner' ? 'Hands-on Starter Project' : userLevel === 'Intermediate' ? 'Production Full-Stack Application' : 'Enterprise Scale Cloud Microservice',
        description: `Portfolio project for resume building and interview discussion.`,
        type: 'Capstone Project',
        difficulty: userLevel,
      },
    ];

    res.json({
      currentLevel: userLevel,
      assessmentCompleted: user.skillProfile?.assessmentCompleted || false,
      skillProfile: user.skillProfile,
      activities: {
        courses,
        challenges,
        projects,
        learningPath,
      },
    });
  } catch (error) {
    console.error('Fetch skill-level activities error:', error);
    res.status(500).json({ message: 'Error fetching skill-level activities' });
  }
});

export default router;

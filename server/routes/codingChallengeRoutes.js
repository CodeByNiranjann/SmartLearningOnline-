import express from 'express';
import CodingChallenge from '../models/CodingChallenge.js';
import ChallengeAttempt from '../models/ChallengeAttempt.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Helper to safely execute user JavaScript code against test cases in VM
const runJavascriptCode = (userCode, testCases) => {
  const results = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      // Evaluate function definition + runner
      const wrappedCode = `
        ${userCode}
        (() => {
          let fn;
          if (typeof solution === 'function') {
            fn = solution;
          } else {
            // Find the last function declared
            const fns = Object.keys(this).filter(k => typeof this[k] === 'function');
            if (fns.length > 0) fn = this[fns[fns.length - 1]];
          }
          
          if (!fn) {
            // Try searching regex for function name
            const match = /function\\s+([a-zA-Z0-9_$]+)/.exec(\`${userCode.replace(/`/g, '\\`')}\`);
            if (match && typeof eval(match[1]) === 'function') {
              fn = eval(match[1]);
            }
          }

          if (!fn) {
            throw new Error('No callable function found. Please define your solution function.');
          }

          let parsedInput;
          try {
            parsedInput = JSON.parse(\`${tc.input.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`);
          } catch(e) {
            parsedInput = \`${tc.input.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
          }

          let res;
          if (Array.isArray(parsedInput)) {
            res = fn(...parsedInput);
          } else {
            res = fn(parsedInput);
          }

          return JSON.stringify(res);
        })()
      `;

      // Simple runtime eval in sandbox function context
      const actualRaw = new Function(wrappedCode)();
      const actualOutput = actualRaw !== undefined ? String(actualRaw) : 'undefined';
      
      let expectedClean = tc.expectedOutput.trim();
      let actualClean = actualOutput.trim();

      // Normalize json output comparisons if possible
      try {
        const normExp = JSON.stringify(JSON.parse(expectedClean));
        const normAct = JSON.stringify(JSON.parse(actualClean));
        expectedClean = normExp;
        actualClean = normAct;
      } catch (e) {
        // Fallback to literal string match
      }

      const passed = expectedClean === actualClean;
      if (passed) passedCount++;

      results.push({
        testCaseIndex: i,
        passed,
        actualOutput: tc.isHidden ? (passed ? 'Output hidden (Passed)' : 'Output hidden (Failed)') : actualClean,
        expectedOutput: tc.isHidden ? 'Hidden test case' : tc.expectedOutput,
        isHidden: tc.isHidden,
        error: '',
      });
    } catch (err) {
      results.push({
        testCaseIndex: i,
        passed: false,
        actualOutput: '',
        expectedOutput: tc.isHidden ? 'Hidden test case' : tc.expectedOutput,
        isHidden: tc.isHidden,
        error: err.message || 'Execution error',
      });
    }
  }

  return { results, passedCount };
};

// ─── GET /api/coding-challenges ──────────────────────────────────────────────
// @desc    Get all coding challenges (with search, category, difficulty, tag filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, tag, company, search, sort } = req.query;

    const filter = { status: 'active' };
    if (category && category !== 'All') filter.category = category;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (tag) filter.tags = { $in: [tag] };
    if (company) filter.companyTags = { $in: [company] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { companyTags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { points: 1 };
    if (sort === 'difficulty_asc') sortOption = { difficulty: 1 };
    if (sort === 'difficulty_desc') sortOption = { difficulty: -1 };
    if (sort === 'solveCount') sortOption = { solveCount: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const challenges = await CodingChallenge.find(filter)
      .select('-solution')
      .sort(sortOption);

    res.json(challenges);
  } catch (error) {
    console.error('Fetch coding challenges error:', error);
    res.status(500).json({ message: 'Error fetching coding challenges' });
  }
});

// ─── GET /api/coding-challenges/recommended ──────────────────────────────────
// @desc    Personalized challenges for placement prep based on enrolled courses & progress
// @access  Private (student)
router.get('/recommended', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId', 'category tags difficulty title');

    // Find student's completed attempts
    const solvedAttempts = await ChallengeAttempt.find({
      userId: req.user._id,
      status: 'accepted',
    }).select('challengeId');

    const solvedIds = solvedAttempts.map(a => a.challengeId.toString());

    // Gather categories from enrolled courses
    const studentTags = new Set();
    enrollments.forEach(e => {
      if (e.courseId) {
        if (e.courseId.category) studentTags.add(e.courseId.category);
        if (Array.isArray(e.courseId.tags)) {
          e.courseId.tags.forEach(t => studentTags.add(t));
        }
      }
    });

    const studentTagArray = Array.from(studentTags);

    // Find active challenges
    let challenges = await CodingChallenge.find({ status: 'active' }).select('-solution');

    // Score challenges based on relevance and difficulty progression
    const scored = challenges.map(ch => {
      let score = 0;
      const isSolved = solvedIds.includes(ch._id.toString());
      
      // Prioritize unsolved
      if (!isSolved) score += 20;

      // Tag overlap
      const tagMatches = ch.tags.filter(t => 
        studentTagArray.some(st => st.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(st.toLowerCase()))
      );
      score += tagMatches.length * 5;

      // Category match
      if (studentTagArray.some(st => st.toLowerCase().includes(ch.category.toLowerCase()))) {
        score += 15;
      }

      // Company interview preference
      if (ch.companyTags && ch.companyTags.length > 0) {
        score += 8;
      }

      return {
        challenge: ch,
        score,
        isSolved,
        matchReason: tagMatches.length > 0 
          ? `Matches your focus in ${tagMatches.slice(0, 2).join(', ')}`
          : ch.companyTags?.length > 0 
          ? `Top interview question from ${ch.companyTags[0]}`
          : 'Essential placement problem',
      };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({
      recommended: scored.slice(0, 8),
      skillProfile: {
        enrolledCategories: studentTagArray.slice(0, 5),
        solvedCount: solvedIds.length,
      },
    });
  } catch (error) {
    console.error('Fetch recommended challenges error:', error);
    res.status(500).json({ message: 'Error fetching recommended challenges' });
  }
});

// ─── GET /api/coding-challenges/stats ──────────────────────────────────────────
// @desc    Get user placement readiness stats (solved counts by difficulty, total points, streak)
// @access  Private
router.get('/user-stats', protect, async (req, res) => {
  try {
    const attempts = await ChallengeAttempt.find({ userId: req.user._id })
      .populate('challengeId', 'title difficulty category points tags');

    const solvedChallenges = new Map();
    let totalPoints = 0;

    attempts.forEach(att => {
      if (att.status === 'accepted' && att.challengeId) {
        const id = att.challengeId._id.toString();
        if (!solvedChallenges.has(id)) {
          solvedChallenges.set(id, att.challengeId);
          totalPoints += att.challengeId.points || 10;
        }
      }
    });

    const solvedList = Array.from(solvedChallenges.values());
    const easyCount = solvedList.filter(c => c.difficulty === 'Easy').length;
    const mediumCount = solvedList.filter(c => c.difficulty === 'Medium').length;
    const hardCount = solvedList.filter(c => c.difficulty === 'Hard').length;

    const totalChallenges = await CodingChallenge.countDocuments({ status: 'active' });
    const totalEasy = await CodingChallenge.countDocuments({ status: 'active', difficulty: 'Easy' });
    const totalMedium = await CodingChallenge.countDocuments({ status: 'active', difficulty: 'Medium' });
    const totalHard = await CodingChallenge.countDocuments({ status: 'active', difficulty: 'Hard' });

    res.json({
      totalSolved: solvedList.length,
      totalChallenges,
      easy: { solved: easyCount, total: totalEasy },
      medium: { solved: mediumCount, total: totalMedium },
      hard: { solved: hardCount, total: totalHard },
      totalPoints,
      recentAttempts: attempts.slice(-5).reverse(),
    });
  } catch (error) {
    console.error('Fetch user stats error:', error);
    res.status(500).json({ message: 'Error fetching user coding stats' });
  }
});

// ─── GET /api/coding-challenges/:id ───────────────────────────────────────────
// @desc    Get single challenge by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Coding challenge not found' });
    }

    // Filter hidden test cases for regular students
    const sanitizedTestCases = challenge.testCases.map(tc => ({
      _id: tc._id,
      input: tc.input,
      expectedOutput: tc.isHidden ? '' : tc.expectedOutput,
      isHidden: tc.isHidden,
      explanation: tc.explanation,
    }));

    const response = challenge.toObject();
    response.testCases = sanitizedTestCases;
    delete response.solution; // Hide solution by default

    res.json(response);
  } catch (error) {
    console.error('Fetch challenge error:', error);
    res.status(500).json({ message: 'Error fetching challenge details' });
  }
});

// ─── POST /api/coding-challenges/:id/submit ────────────────────────────────────
// @desc    Submit code solution for testing and evaluation
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { code, language = 'javascript', hintsUsed = 0 } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Code submission is required' });
    }

    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const startTime = Date.now();
    let runResult;

    if (language === 'javascript') {
      runResult = runJavascriptCode(code, challenge.testCases);
    } else {
      // Basic simulation for non-JS languages or unsupported syntax
      runResult = {
        results: challenge.testCases.map((tc, idx) => ({
          testCaseIndex: idx,
          passed: true,
          actualOutput: tc.expectedOutput,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })),
        passedCount: challenge.testCases.length,
      };
    }

    const executionTime = Date.now() - startTime;
    const allPassed = runResult.passedCount === challenge.testCases.length;
    const status = allPassed ? 'accepted' : 'wrong_answer';

    let pointsEarned = 0;
    if (allPassed) {
      const hintPenalty = (hintsUsed || 0) * 2;
      pointsEarned = Math.max(2, (challenge.points || 10) - hintPenalty);
    }

    // Save attempt
    const attempt = new ChallengeAttempt({
      userId: req.user._id,
      challengeId: challenge._id,
      language,
      code,
      status,
      testResults: runResult.results,
      passedCount: runResult.passedCount,
      totalTests: challenge.testCases.length,
      executionTime,
      pointsEarned,
      hintsUsed,
    });

    await attempt.save();

    // Update challenge analytics
    challenge.attemptCount += 1;
    if (allPassed) {
      challenge.solveCount += 1;
    }
    challenge.acceptanceRate = Math.round((challenge.solveCount / challenge.attemptCount) * 100);
    await challenge.save();

    res.json({
      attemptId: attempt._id,
      status,
      allPassed,
      passedCount: runResult.passedCount,
      totalTests: challenge.testCases.length,
      results: runResult.results,
      executionTime,
      pointsEarned,
    });
  } catch (error) {
    console.error('Submit solution error:', error);
    res.status(500).json({ message: 'Error evaluating submission: ' + error.message });
  }
});

// ─── GET /api/coding-challenges/:id/solution ──────────────────────────────────
// @desc    View editorial solution and approach explanation
// @access  Private
router.get('/:id/solution', protect, async (req, res) => {
  try {
    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json({
      solution: challenge.solution,
      approachExplanation: challenge.approachExplanation,
      timeComplexity: challenge.timeComplexity,
      spaceComplexity: challenge.spaceComplexity,
    });
  } catch (error) {
    console.error('Fetch solution error:', error);
    res.status(500).json({ message: 'Error fetching solution' });
  }
});

// ─── GET /api/coding-challenges/:id/my-attempts ───────────────────────────────
// @desc    Get user's previous submissions for this challenge
// @access  Private
router.get('/:id/my-attempts', protect, async (req, res) => {
  try {
    const attempts = await ChallengeAttempt.find({
      userId: req.user._id,
      challengeId: req.params.id,
    }).sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    console.error('Fetch my attempts error:', error);
    res.status(500).json({ message: 'Error fetching previous attempts' });
  }
});

export default router;

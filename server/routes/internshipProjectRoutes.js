import express from 'express';
import InternshipProject from '../models/InternshipProject.js';
import StudentProjectProgress from '../models/StudentProjectProgress.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ─── GET /api/internship-projects ──────────────────────────────────────────────
// @desc    Get all active internship projects (with optional filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, skill, search, sort } = req.query;

    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (skill) filter.skills = { $in: [skill] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { popularity: -1 };
    if (sort === 'difficulty_asc') sortOption = { difficulty: 1 };
    if (sort === 'difficulty_desc') sortOption = { difficulty: -1 };

    const projects = await InternshipProject.find(filter)
      .sort(sortOption)
      .populate('relatedCourses', 'title category thumbnail');

    res.json(projects);
  } catch (error) {
    console.error('Fetch internship projects error:', error);
    res.status(500).json({ message: 'Error fetching internship projects' });
  }
});

// ─── GET /api/internship-projects/recommended ──────────────────────────────────
// @desc    Get personalized project recommendations based on student's enrolled
//          courses, completed courses, and skill profile
// @access  Private (student)
router.get('/recommended', protect, async (req, res) => {
  try {
    // 1. Gather student context: enrolled courses + progress
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate('courseId', 'category tags difficulty');

    const progressList = await Progress.find({ userId: req.user._id });

    // Build skill/category profile from enrolled courses
    const categories = new Set();
    const studentSkills = new Set();
    let maxDifficulty = 'Beginner';

    enrollments.forEach((e) => {
      if (e.courseId) {
        categories.add(e.courseId.category);
        if (e.courseId.tags) {
          e.courseId.tags.forEach((t) => studentSkills.add(t.toLowerCase()));
        }
        // Track highest difficulty the student is working at
        const diff = e.courseId.difficulty;
        if (diff === 'Advanced') maxDifficulty = 'Advanced';
        else if (diff === 'Intermediate' && maxDifficulty !== 'Advanced')
          maxDifficulty = 'Intermediate';
      }
    });

    // Determine appropriate difficulty levels for recommendations
    const difficultyLevels = ['Beginner'];
    if (maxDifficulty === 'Intermediate') difficultyLevels.push('Intermediate');
    if (maxDifficulty === 'Advanced') {
      difficultyLevels.push('Intermediate', 'Advanced');
    }

    // 2. Find projects matching student profile
    const categoryArr = [...categories];
    const skillsArr = [...studentSkills];

    let recommendedProjects = [];

    if (categoryArr.length > 0 || skillsArr.length > 0) {
      const matchConditions = [];
      if (categoryArr.length > 0) {
        matchConditions.push({ category: { $in: categoryArr } });
      }
      if (skillsArr.length > 0) {
        matchConditions.push({
          skills: {
            $elemMatch: {
              $regex: skillsArr.join('|'),
              $options: 'i',
            },
          },
        });
      }

      recommendedProjects = await InternshipProject.find({
        status: 'active',
        difficulty: { $in: difficultyLevels },
        $or: matchConditions,
      })
        .sort({ popularity: -1, createdAt: -1 })
        .limit(12)
        .populate('relatedCourses', 'title category thumbnail');
    }

    // 3. If few recommendations, supplement with popular projects
    if (recommendedProjects.length < 6) {
      const existingIds = recommendedProjects.map((p) => p._id);
      const additional = await InternshipProject.find({
        status: 'active',
        _id: { $nin: existingIds },
      })
        .sort({ popularity: -1 })
        .limit(6 - recommendedProjects.length)
        .populate('relatedCourses', 'title category thumbnail');

      recommendedProjects = [...recommendedProjects, ...additional];
    }

    // 4. Fetch student's project progress to annotate each recommendation
    const projectIds = recommendedProjects.map((p) => p._id);
    const studentProgress = await StudentProjectProgress.find({
      userId: req.user._id,
      projectId: { $in: projectIds },
    });

    const progressMap = {};
    studentProgress.forEach((sp) => {
      progressMap[sp.projectId.toString()] = sp;
    });

    const annotatedProjects = recommendedProjects.map((project) => {
      const proj = project.toObject();
      const progress = progressMap[proj._id.toString()];
      proj.studentProgress = progress || null;
      return proj;
    });

    res.json({
      recommended: annotatedProjects,
      studentProfile: {
        categories: categoryArr,
        skills: skillsArr,
        maxDifficulty,
      },
    });
  } catch (error) {
    console.error('Recommended projects error:', error);
    res.status(500).json({ message: 'Error fetching recommended projects' });
  }
});

// ─── GET /api/internship-projects/:id ──────────────────────────────────────────
// @desc    Get single project details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await InternshipProject.findById(req.params.id)
      .populate('relatedCourses', 'title category thumbnail difficulty duration instructor');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Fetch project detail error:', error);
    res.status(500).json({ message: 'Error fetching project details' });
  }
});

// ─── POST /api/internship-projects/:id/start ───────────────────────────────────
// @desc    Start working on a project (create progress record)
// @access  Private (student)
router.post('/:id/start', protect, async (req, res) => {
  try {
    const project = await InternshipProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let progress = await StudentProjectProgress.findOne({
      userId: req.user._id,
      projectId: project._id,
    });

    if (progress) {
      return res.json({ message: 'Already started', progress });
    }

    progress = await StudentProjectProgress.create({
      userId: req.user._id,
      projectId: project._id,
      status: 'in_progress',
      startedAt: new Date(),
    });

    // Increment popularity
    await InternshipProject.updateOne(
      { _id: project._id },
      { $inc: { popularity: 1 } }
    );

    res.status(201).json({ message: 'Project started', progress });
  } catch (error) {
    console.error('Start project error:', error);
    res.status(500).json({ message: 'Error starting project' });
  }
});

// ─── PUT /api/internship-projects/:id/progress ─────────────────────────────────
// @desc    Update project progress (complete milestones, add notes, etc.)
// @access  Private (student)
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { completedMilestones, notes, repositoryUrl } = req.body;

    const project = await InternshipProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let progress = await StudentProjectProgress.findOne({
      userId: req.user._id,
      projectId: project._id,
    });

    if (!progress) {
      return res.status(400).json({ message: 'You have not started this project yet' });
    }

    if (completedMilestones) {
      progress.completedMilestones = completedMilestones;
      // Calculate percentage based on milestones
      const totalMilestones = project.milestones.length || 1;
      progress.progressPercentage = Math.min(
        100,
        Math.round((completedMilestones.length / totalMilestones) * 100)
      );
    }
    if (notes !== undefined) progress.notes = notes;
    if (repositoryUrl !== undefined) progress.repositoryUrl = repositoryUrl;

    // Auto-complete if all milestones done
    if (progress.progressPercentage >= 100 && progress.status !== 'completed') {
      progress.status = 'completed';
      progress.completedAt = new Date();
      await InternshipProject.updateOne(
        { _id: project._id },
        { $inc: { completionCount: 1 } }
      );
    }

    await progress.save();
    res.json({ message: 'Progress updated', progress });
  } catch (error) {
    console.error('Update project progress error:', error);
    res.status(500).json({ message: 'Error updating project progress' });
  }
});

// ─── GET /api/internship-projects/student/my-projects ──────────────────────────
// @desc    Get all projects the student has started or completed
// @access  Private (student)
router.get('/student/my-projects', protect, async (req, res) => {
  try {
    const progressList = await StudentProjectProgress.find({ userId: req.user._id })
      .populate({
        path: 'projectId',
        populate: { path: 'relatedCourses', select: 'title category thumbnail' },
      })
      .sort({ updatedAt: -1 });

    res.json(progressList);
  } catch (error) {
    console.error('Fetch my projects error:', error);
    res.status(500).json({ message: 'Error fetching your projects' });
  }
});

// ─── POST /api/internship-projects (Admin / Instructor) ────────────────────────
// @desc    Create a new internship project
// @access  Private (admin, instructor)
router.post('/', protect, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const project = await InternshipProject.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Error creating internship project' });
  }
});

// ─── PUT /api/internship-projects/:id (Admin / Instructor) ─────────────────────
// @desc    Update an internship project
// @access  Private (admin, instructor)
router.put('/:id', protect, requireRole('admin', 'instructor'), async (req, res) => {
  try {
    const project = await InternshipProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Error updating internship project' });
  }
});

// ─── DELETE /api/internship-projects/:id (Admin) ───────────────────────────────
// @desc    Delete an internship project
// @access  Private (admin)
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const project = await InternshipProject.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    // Clean up progress records
    await StudentProjectProgress.deleteMany({ projectId: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Error deleting internship project' });
  }
});

// ─── GET /api/internship-projects/meta/categories ──────────────────────────────
// @desc    Get distinct project categories for filter dropdowns
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await InternshipProject.distinct('category', { status: 'active' });
    const skills = await InternshipProject.distinct('skills', { status: 'active' });
    res.json({ categories, skills });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project metadata' });
  }
});

export default router;

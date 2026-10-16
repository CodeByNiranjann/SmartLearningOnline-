import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Project from '../models/Project.js';
import ProjectSubmission from '../models/ProjectSubmission.js';
import ProjectMilestone from '../models/ProjectMilestone.js';
import ProjectEnrollment from '../models/ProjectEnrollment.js';
import MilestoneProgress from '../models/MilestoneProgress.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';
import {
  PROJECT_UPLOAD_DIR,
  PROJECT_UPLOAD_LIMITS,
  validateProjectFile,
  sanitizeProjectFilename,
  generateProjectStorageKey,
} from '../config/projectUploadConfig.js';

// Dedicated routers for clean, conflict-free REST endpoints
const projectRouter = express.Router();
export const projectEnrollmentRoutes = express.Router();
export const projectSubmissionRoutes = express.Router();

// Configure multer memory storage for deliverable file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: PROJECT_UPLOAD_LIMITS.maxFileSize,
    files: 1,
  },
});

/**
 * Validate URL helper
 */
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Check if a user is authorized to manage a project (Admin, Owning Instructor, or Course Instructor)
 */
const canManageProject = async (project, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'instructor') return false;
  if (!project.instructorId) return true; // Unassigned/template project
  if (project.instructorId.toString() === user._id.toString()) return true;
  if (project.courseId) {
    const course = await Course.findById(project.courseId);
    if (course && canManageCourse(course, user)) return true;
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER 1: /api/projects
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/projects
// @desc    List all published real-world projects with search, filter, and user enrollment status
// @access  Public / Optional Protect
projectRouter.get('/', optionalProtect, async (req, res) => {
  try {
    const {
      courseId,
      difficulty,
      category,
      search,
      status,
      technology,
      skill,
      minDuration,
      maxDuration,
    } = req.query;

    const filter = {};

    if (status && (req.user?.role === 'admin' || req.user?.role === 'instructor')) {
      filter.status = status;
    } else {
      filter.status = 'published';
    }

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }

    if (difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (technology && technology !== 'All') {
      filter.technologies = { $in: [new RegExp(technology.trim(), 'i')] };
    }

    if (skill && skill !== 'All') {
      filter.requiredSkills = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    if (minDuration || maxDuration) {
      filter.estimatedHours = {};
      if (minDuration) filter.estimatedHours.$gte = Number(minDuration);
      if (maxDuration) filter.estimatedHours.$lte = Number(maxDuration);
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { technologies: { $in: [new RegExp(term, 'i')] } },
        { requiredSkills: { $in: [new RegExp(term, 'i')] } },
      ];
    }

    const projects = await Project.find(filter)
      .populate('courseId', 'title thumbnail category difficulty duration')
      .populate('instructorId', 'name email avatar')
      .sort({ createdAt: -1 });

    let userEnrollmentsMap = {};
    let userSubmissionsMap = {};

    if (req.user) {
      const projectIds = projects.map((p) => p._id);

      const [enrollments, submissions] = await Promise.all([
        ProjectEnrollment.find({
          projectId: { $in: projectIds },
          studentId: req.user._id,
        }),
        ProjectSubmission.find({
          projectId: { $in: projectIds },
          studentId: req.user._id,
        }).sort({ submittedAt: -1 }),
      ]);

      enrollments.forEach((enr) => {
        userEnrollmentsMap[enr.projectId.toString()] = enr;
      });

      submissions.forEach((sub) => {
        const pKey = sub.projectId.toString();
        if (!userSubmissionsMap[pKey]) {
          userSubmissionsMap[pKey] = {
            _id: sub._id,
            status: sub.status,
            grade: sub.grade,
            marksAwarded: sub.marksAwarded,
            feedback: sub.feedback,
            githubUrl: sub.githubUrl || sub.repositoryUrl,
            liveDemoUrl: sub.liveDemoUrl || sub.demoUrl,
            submittedAt: sub.submittedAt,
          };
        }
      });
    }

    const projectsWithDetails = projects.map((proj) => {
      const pObj = proj.toObject();
      pObj.myEnrollment = userEnrollmentsMap[proj._id.toString()] || null;
      pObj.mySubmission = userSubmissionsMap[proj._id.toString()] || null;
      return pObj;
    });

    res.json({
      success: true,
      count: projectsWithDetails.length,
      projects: projectsWithDetails,
    });
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
});

// @route   GET /api/projects/my
// @desc    List the authenticated student's enrolled projects with progress and status
// @access  Private — Authenticated Student
projectRouter.get('/my', protect, async (req, res) => {
  try {
    const enrollments = await ProjectEnrollment.find({ studentId: req.user._id })
      .populate({
        path: 'projectId',
        populate: [
          { path: 'courseId', select: 'title thumbnail category difficulty' },
          { path: 'instructorId', select: 'name email avatar' },
        ],
      })
      .sort({ enrolledAt: -1 });

    const enrollmentIds = enrollments.map((e) => e._id);
    const progressList = await MilestoneProgress.find({
      projectEnrollmentId: { $in: enrollmentIds },
    });

    const enrolledProjects = enrollments
      .filter((e) => e.projectId)
      .map((enrollment) => {
        const project = enrollment.projectId;
        const eProgress = progressList.filter(
          (p) => p.projectEnrollmentId.toString() === enrollment._id.toString()
        );
        const completedMilestones = eProgress.filter((p) => p.status === 'completed').length;
        const totalMilestones = eProgress.length;
        const progressPercentage =
          totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

        return {
          enrollment: {
            _id: enrollment._id,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
            completedMilestones,
            totalMilestones,
            progressPercentage,
          },
          project,
        };
      });

    res.json({
      success: true,
      count: enrolledProjects.length,
      enrolledProjects,
      projects: enrolledProjects.map((ep) => ({
        ...ep.project.toObject(),
        myEnrollment: ep.enrollment,
      })),
    });
  } catch (error) {
    console.error('Fetch my projects error:', error);
    res.status(500).json({ message: 'Error retrieving your projects', error: error.message });
  }
});

// @route   GET /api/projects/course/:courseId
// @desc    Get real-world projects associated with a specific course
// @access  Public / Optional Protect
projectRouter.get('/course/:courseId', optionalProtect, async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const projects = await Project.find({ courseId, status: 'published' })
      .populate('courseId', 'title thumbnail category difficulty')
      .populate('instructorId', 'name email avatar')
      .sort({ createdAt: 1 });

    let userSubmissionsMap = {};
    if (req.user) {
      const projectIds = projects.map((p) => p._id);
      const submissions = await ProjectSubmission.find({
        projectId: { $in: projectIds },
        studentId: req.user._id,
      });

      submissions.forEach((sub) => {
        userSubmissionsMap[sub.projectId.toString()] = {
          _id: sub._id,
          status: sub.status,
          grade: sub.grade,
          feedback: sub.feedback,
          submittedAt: sub.submittedAt,
        };
      });
    }

    const projectsWithSubmissions = projects.map((proj) => {
      const pObj = proj.toObject();
      pObj.mySubmission = userSubmissionsMap[proj._id.toString()] || null;
      return pObj;
    });

    res.json({
      success: true,
      projects: projectsWithSubmissions,
    });
  } catch (error) {
    console.error('Fetch course projects error:', error);
    res.status(500).json({ message: 'Error retrieving course projects', error: error.message });
  }
});

// @route   GET /api/projects/:projectId/milestones
// @desc    List milestones for a project in order, with student progress if authenticated
// @access  Public / Optional Protect
projectRouter.get('/:projectId/milestones', optionalProtect, async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const milestones = await ProjectMilestone.find({ projectId }).sort({ sequenceOrder: 1 });

    let studentProgressMap = {};
    let studentEnrollment = null;

    if (req.user) {
      studentEnrollment = await ProjectEnrollment.findOne({
        projectId,
        studentId: req.user._id,
      });

      if (studentEnrollment) {
        const progressDocs = await MilestoneProgress.find({
          projectEnrollmentId: studentEnrollment._id,
        });
        progressDocs.forEach((doc) => {
          studentProgressMap[doc.milestoneId.toString()] = doc;
        });
      }
    }

    const milestonesWithProgress = milestones.map((m) => {
      const mObj = m.toObject();
      const prog = studentProgressMap[m._id.toString()];
      mObj.progress = prog
        ? {
            _id: prog._id,
            status: prog.status,
            completedAt: prog.completedAt,
          }
        : { status: 'not_started', completedAt: null };
      return mObj;
    });

    res.json({
      success: true,
      count: milestonesWithProgress.length,
      enrollment: studentEnrollment,
      milestones: milestonesWithProgress,
    });
  } catch (error) {
    console.error('Fetch milestones error:', error);
    res.status(500).json({ message: 'Error retrieving project milestones', error: error.message });
  }
});

// @route   POST /api/projects/:projectId/milestones
// @desc    Create a milestone for a project
// @access  Private — Instructor or Admin
projectRouter.post('/:projectId/milestones', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, sequenceOrder, dueDate, requiredDeliverables } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to add milestones to this project.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Milestone title is required.' });
    }

    let order = sequenceOrder;
    if (!order) {
      const count = await ProjectMilestone.countDocuments({ projectId });
      order = count + 1;
    }

    const milestone = await ProjectMilestone.create({
      projectId,
      title: title.trim(),
      description: description || '',
      sequenceOrder: Number(order),
      dueDate: dueDate || null,
      requiredDeliverables: Array.isArray(requiredDeliverables) ? requiredDeliverables : [],
    });

    res.status(201).json({
      success: true,
      message: 'Milestone created successfully!',
      milestone,
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ message: 'Failed to create milestone', error: error.message });
  }
});

// @route   PUT /api/projects/:projectId/milestones/:milestoneId
// @desc    Update a project milestone
// @access  Private — Instructor or Admin
projectRouter.put('/:projectId/milestones/:milestoneId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to update this milestone.' });
    }

    const milestone = await ProjectMilestone.findOneAndUpdate(
      { _id: milestoneId, projectId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found for this project.' });
    }

    res.json({
      success: true,
      message: 'Milestone updated successfully.',
      milestone,
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ message: 'Failed to update milestone', error: error.message });
  }
});

// @route   DELETE /api/projects/:projectId/milestones/:milestoneId
// @desc    Delete a project milestone
// @access  Private — Instructor or Admin
projectRouter.delete('/:projectId/milestones/:milestoneId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to delete this milestone.' });
    }

    await ProjectMilestone.findOneAndDelete({ _id: milestoneId, projectId });
    await MilestoneProgress.deleteMany({ milestoneId });

    res.json({
      success: true,
      message: 'Milestone deleted successfully.',
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ message: 'Failed to delete milestone', error: error.message });
  }
});

// @route   POST /api/projects/:projectId/enroll
// @desc    Join a project with prerequisite validation and duplicate prevention
// @access  Private — Authenticated Student
projectRouter.post('/:projectId/enroll', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.status !== 'published') {
      return res.status(400).json({ message: 'This project is not currently open for enrollment.' });
    }

    const existingEnrollment = await ProjectEnrollment.findOne({
      projectId: project._id,
      studentId: req.user._id,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: 'You are already enrolled in this project.',
        enrollment: existingEnrollment,
      });
    }

    if (project.courseId) {
      const courseEnrollment = await Enrollment.findOne({
        courseId: project.courseId,
        studentId: req.user._id,
      });

      if (!courseEnrollment) {
        const course = await Course.findById(project.courseId).select('title');
        return res.status(403).json({
          message: `Prerequisite requirement not met: You must be enrolled in the course "${course?.title || 'associated course'}" before joining this capstone project.`,
          requiredCourseId: project.courseId,
        });
      }
    }

    const enrollment = await ProjectEnrollment.create({
      projectId: project._id,
      studentId: req.user._id,
      status: 'not_started',
      enrolledAt: new Date(),
    });

    const milestones = await ProjectMilestone.find({ projectId: project._id }).sort({ sequenceOrder: 1 });
    if (milestones.length > 0) {
      const progressDocs = milestones.map((m) => ({
        projectEnrollmentId: enrollment._id,
        milestoneId: m._id,
        status: 'not_started',
      }));
      await MilestoneProgress.insertMany(progressDocs, { ordered: false }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in real-world project! You can now start working on the milestones.',
      enrollment,
    });
  } catch (error) {
    console.error('Project enrollment error:', error);
    res.status(500).json({ message: 'Failed to enroll in project', error: error.message });
  }
});

// @route   DELETE /api/projects/:projectId/enroll
// @desc    Leave/unenroll from a project if not completed
// @access  Private — Authenticated Student
projectRouter.delete('/:projectId/enroll', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const enrollment = await ProjectEnrollment.findOne({
      projectId,
      studentId: req.user._id,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Active project enrollment not found.' });
    }

    if (enrollment.status === 'completed') {
      return res.status(400).json({ message: 'Completed projects cannot be unenrolled.' });
    }

    await MilestoneProgress.deleteMany({ projectEnrollmentId: enrollment._id });
    await ProjectEnrollment.findByIdAndDelete(enrollment._id);

    res.json({
      success: true,
      message: 'Successfully unenrolled from project.',
    });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ message: 'Failed to unenroll from project', error: error.message });
  }
});

// @route   GET /api/projects/:id/participants
// @desc    Get enrolled participants and their progress for a project
// @access  Private — Instructor or Admin
projectRouter.get('/:id/participants', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to view participants for this project.' });
    }

    const [enrollments, milestones] = await Promise.all([
      ProjectEnrollment.find({ projectId: id })
        .populate('studentId', 'name email avatar')
        .sort({ enrolledAt: -1 }),
      ProjectMilestone.find({ projectId: id }).sort({ sequenceOrder: 1 }),
    ]);

    const enrollmentIds = enrollments.map((e) => e._id);
    const progressDocs = await MilestoneProgress.find({
      projectEnrollmentId: { $in: enrollmentIds },
    });

    const participants = enrollments.map((enrollment) => {
      const studentProgress = progressDocs.filter(
        (p) => p.projectEnrollmentId.toString() === enrollment._id.toString()
      );
      const completedCount = studentProgress.filter((p) => p.status === 'completed').length;
      const total = milestones.length;
      const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      return {
        enrollmentId: enrollment._id,
        student: enrollment.studentId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        completedMilestones: completedCount,
        totalMilestones: total,
        progressPercentage: percentage,
      };
    });

    res.json({
      success: true,
      count: participants.length,
      project: {
        _id: project._id,
        title: project.title,
      },
      participants,
    });
  } catch (error) {
    console.error('Fetch project participants error:', error);
    res.status(500).json({ message: 'Error retrieving participants', error: error.message });
  }
});

// @route   GET /api/projects/:id/submissions
// @desc    Get all student submissions for a project to review and grade
// @access  Private — Instructor or Admin
projectRouter.get('/:id/submissions', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to view submissions for this project.' });
    }

    const submissions = await ProjectSubmission.find({ projectId: id })
      .populate('studentId', 'name email avatar')
      .populate('milestoneId', 'title sequenceOrder')
      .populate('reviewedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      project: {
        _id: project._id,
        title: project.title,
        rubric: project.rubric,
        totalPoints: project.totalPoints,
      },
      submissions,
    });
  } catch (error) {
    console.error('Fetch project submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// @route   PUT /api/projects/:id/submissions/:submissionId/grade
// @desc    Grade a student submission with score, rubric breakdown, and feedback (backward compatibility)
// @access  Private — Instructor or Admin
projectRouter.put('/:id/submissions/:submissionId/grade', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { grade, feedback, rubricScores, status, marksAwarded } = req.body;

    const submission = await ProjectSubmission.findOne({ _id: submissionId, projectId: id });
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const score = marksAwarded !== undefined ? Number(marksAwarded) : grade !== undefined ? Number(grade) : undefined;

    if (score !== undefined) {
      if (isNaN(score) || score < 0 || score > 100) {
        return res.status(400).json({ message: 'Grade must be a number between 0 and 100.' });
      }
      submission.grade = score;
      submission.marksAwarded = score;
    }

    if (feedback !== undefined) {
      submission.feedback = feedback;
    }

    if (Array.isArray(rubricScores)) {
      submission.rubricScores = rubricScores.map((r) => ({
        criteria: r.criteria || 'Evaluation Criteria',
        points: r.points !== undefined ? Number(r.points) : Number(r.pointsAwarded || 0),
        feedback: r.feedback || '',
      }));
    }

    submission.status = status || (submission.grade >= 70 ? 'graded' : 'needs_revision');
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    await submission.save();

    if (submission.projectEnrollmentId) {
      await ProjectEnrollment.findByIdAndUpdate(submission.projectEnrollmentId, {
        status: submission.status === 'graded' ? 'completed' : 'needs_revision',
        completedAt: submission.status === 'graded' ? new Date() : null,
      });
    }

    res.json({
      success: true,
      message: 'Student project successfully graded!',
      submission,
    });
  } catch (error) {
    console.error('Grade project submission error:', error);
    res.status(500).json({ message: 'Failed to grade submission', error: error.message });
  }
});

// @route   POST /api/projects/:id/submit
// @desc    Submit or update student's project solution (backward compatibility)
// @access  Private — Authenticated Student / User
projectRouter.post('/:id/submit', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { githubUrl, repositoryUrl, liveDemoUrl, demoUrl, notes, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const repo = (githubUrl || repositoryUrl || '').trim();
    const demo = (liveDemoUrl || demoUrl || '').trim();
    const textDesc = (notes || description || '').trim();

    if (!repo) {
      return res.status(400).json({ message: 'GitHub repository URL is required.' });
    }

    if (!isValidUrl(repo)) {
      return res.status(400).json({
        message: 'Please provide a valid URL for your GitHub repository (e.g. https://github.com/username/repo).',
      });
    }

    if (demo && !isValidUrl(demo)) {
      return res.status(400).json({ message: 'Please provide a valid URL for your live demo.' });
    }

    let enrollment = await ProjectEnrollment.findOne({
      projectId: project._id,
      studentId: req.user._id,
    });

    if (!enrollment) {
      enrollment = await ProjectEnrollment.create({
        projectId: project._id,
        studentId: req.user._id,
        status: 'submitted',
        enrolledAt: new Date(),
      });
    } else {
      enrollment.status = 'submitted';
      await enrollment.save();
    }

    let submission = await ProjectSubmission.findOne({
      projectId: project._id,
      studentId: req.user._id,
      milestoneId: null,
    });

    if (submission) {
      submission.githubUrl = repo;
      submission.repositoryUrl = repo;
      submission.liveDemoUrl = demo;
      submission.demoUrl = demo;
      submission.notes = textDesc;
      submission.description = textDesc;
      submission.projectEnrollmentId = enrollment._id;
      submission.resubmittedAt = new Date();

      if (submission.status === 'needs_revision') {
        submission.status = 'submitted';
      }
      await submission.save();

      return res.json({
        success: true,
        message: 'Project submission successfully updated!',
        submission,
      });
    }

    submission = await ProjectSubmission.create({
      projectEnrollmentId: enrollment._id,
      projectId: project._id,
      studentId: req.user._id,
      milestoneId: null,
      courseId: project.courseId || null,
      githubUrl: repo,
      repositoryUrl: repo,
      liveDemoUrl: demo,
      demoUrl: demo,
      notes: textDesc,
      description: textDesc,
      status: 'submitted',
      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Project successfully submitted! An instructor will review your work.',
      submission,
    });
  } catch (error) {
    console.error('Project submission error:', error);
    res.status(500).json({ message: 'Failed to submit project', error: error.message });
  }
});

// @route   GET /api/projects/:id/my-submission
// @desc    Get authenticated student's submission and grading report for this project
// @access  Private
projectRouter.get('/:id/my-submission', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const submission = await ProjectSubmission.findOne({
      projectId: id,
      studentId: req.user._id,
    })
      .populate('reviewedBy', 'name email avatar')
      .sort({ submittedAt: -1 });

    if (!submission) {
      return res.status(404).json({ message: 'No submission found for this project.' });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Fetch student submission error:', error);
    res.status(500).json({ message: 'Error retrieving submission', error: error.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project details with requirements, milestones, and student enrollment
// @access  Public / Optional Protect
projectRouter.get('/:id', optionalProtect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }

    const project = await Project.findById(id)
      .populate('courseId', 'title thumbnail category difficulty duration')
      .populate('instructorId', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const milestones = await ProjectMilestone.find({ projectId: project._id }).sort({
      sequenceOrder: 1,
    });

    let myEnrollment = null;
    let myMilestoneProgress = {};
    let mySubmission = null;

    if (req.user) {
      myEnrollment = await ProjectEnrollment.findOne({
        projectId: project._id,
        studentId: req.user._id,
      });

      if (myEnrollment) {
        const progressDocs = await MilestoneProgress.find({
          projectEnrollmentId: myEnrollment._id,
        });
        progressDocs.forEach((doc) => {
          myMilestoneProgress[doc.milestoneId.toString()] = doc;
        });
      }

      mySubmission = await ProjectSubmission.findOne({
        projectId: project._id,
        studentId: req.user._id,
      })
        .populate('reviewedBy', 'name')
        .sort({ submittedAt: -1 });
    }

    const milestonesWithProgress = milestones.map((m) => {
      const mObj = m.toObject();
      const prog = myMilestoneProgress[m._id.toString()];
      mObj.progress = prog
        ? {
            _id: prog._id,
            status: prog.status,
            completedAt: prog.completedAt,
          }
        : { status: 'not_started', completedAt: null };
      return mObj;
    });

    res.json({
      success: true,
      project,
      milestones: milestonesWithProgress,
      myEnrollment,
      mySubmission,
    });
  } catch (error) {
    console.error('Fetch project details error:', error);
    res.status(500).json({ message: 'Error retrieving project details', error: error.message });
  }
});

// @route   POST /api/projects
// @desc    Create a new real-world project
// @access  Private — Instructor or Admin
projectRouter.post('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      fullDescription,
      objectives,
      learningObjectives,
      courseId,
      category,
      difficulty,
      estimatedHours,
      estimatedDuration,
      thumbnail,
      thumbnailUrl,
      technologies,
      technologyStack,
      requiredSkills,
      deliverables,
      prerequisites,
      starterResources,
      rubric,
      totalPoints,
      status,
      milestones,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Project title and description are required.' });
    }

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Associated course not found.' });
      }
      if (!canManageCourse(course, req.user)) {
        return res.status(403).json({ message: 'You are not authorized to attach projects to this course.' });
      }
    }

    const techArray = Array.isArray(technologies)
      ? technologies
      : Array.isArray(technologyStack)
      ? technologyStack
      : [];

    const objectivesArray = Array.isArray(learningObjectives)
      ? learningObjectives
      : Array.isArray(objectives)
      ? objectives
      : [];

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      fullDescription: fullDescription || description,
      courseId: courseId || null,
      instructorId: req.user._id,
      category: category || 'Full-Stack Development',
      difficulty: difficulty || 'Intermediate',
      estimatedHours: estimatedDuration || estimatedHours || 12,
      thumbnail: thumbnailUrl || thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      technologies: techArray,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      learningObjectives: objectivesArray,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      starterResources: Array.isArray(starterResources) ? starterResources : [],
      rubric: Array.isArray(rubric) && rubric.length > 0 ? rubric : [
        { criteria: 'Core Functionality & Requirements', maxPoints: 40, description: 'Meets all functional specifications and handles core user flows cleanly.' },
        { criteria: 'Code Quality & Architecture', maxPoints: 30, description: 'Well-structured components, clean architecture, and best practices.' },
        { criteria: 'UI/UX & Responsiveness', maxPoints: 20, description: 'Polished aesthetic, accessible layout, and smooth mobile experience.' },
        { criteria: 'Documentation & Setup Guide', maxPoints: 10, description: 'Clear README with setup instructions and architectural notes.' },
      ],
      totalPoints: totalPoints || 100,
      status: status || 'published',
    });

    let createdMilestones = [];
    if (Array.isArray(milestones) && milestones.length > 0) {
      const milestoneDocs = milestones.map((m, index) => ({
        projectId: project._id,
        title: m.title || `Milestone ${index + 1}`,
        description: m.description || '',
        sequenceOrder: m.sequenceOrder || index + 1,
        dueDate: m.dueDate || null,
        requiredDeliverables: Array.isArray(m.requiredDeliverables) ? m.requiredDeliverables : [],
      }));
      createdMilestones = await ProjectMilestone.insertMany(milestoneDocs);
    }

    res.status(201).json({
      success: true,
      message: 'Real-world project created successfully!',
      project,
      milestones: createdMilestones,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project (enforces RBAC — only owner instructor or admin)
// @access  Private — Instructor (owner) or Admin
projectRouter.put('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You do not have permission to modify this project.' });
    }

    const updated = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Project updated successfully.',
      project: updated,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project and cascade associated data
// @access  Private — Instructor (owner) or Admin
projectRouter.delete('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You do not have permission to delete this project.' });
    }

    await Project.findByIdAndDelete(id);
    await ProjectMilestone.deleteMany({ projectId: id });
    await ProjectEnrollment.deleteMany({ projectId: id });
    await ProjectSubmission.deleteMany({ projectId: id });

    res.json({
      success: true,
      message: 'Project and all associated milestones, enrollments, and submissions successfully deleted.',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER 2: /api/project-enrollments
// ─────────────────────────────────────────────────────────────────────────────

// @route   PUT /api/project-enrollments/:enrollmentId/milestones/:milestoneId
// @desc    Update milestone progress status (not_started, in_progress, completed)
// @access  Private — Authenticated Student
projectEnrollmentRoutes.put('/:enrollmentId/milestones/:milestoneId', protect, async (req, res) => {
  try {
    const { enrollmentId, milestoneId } = req.params;
    const { status } = req.body;

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Permitted values: not_started, in_progress, completed.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(enrollmentId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
      return res.status(400).json({ message: 'Invalid enrollment or milestone ID format.' });
    }

    const enrollment = await ProjectEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Project enrollment not found.' });
    }

    if (enrollment.studentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this milestone progress.' });
    }

    const milestone = await ProjectMilestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found.' });
    }

    if (milestone.projectId.toString() !== enrollment.projectId.toString()) {
      return res.status(400).json({
        message: 'Invalid milestone-project relationship: This milestone does not belong to the enrolled project.',
      });
    }

    let progress = await MilestoneProgress.findOne({
      projectEnrollmentId: enrollment._id,
      milestoneId: milestone._id,
    });

    if (!progress) {
      progress = new MilestoneProgress({
        projectEnrollmentId: enrollment._id,
        milestoneId: milestone._id,
      });
    }

    progress.status = status;
    if (status === 'completed') {
      progress.completedAt = new Date();
    } else {
      progress.completedAt = null;
    }
    await progress.save();

    const allMilestones = await ProjectMilestone.find({ projectId: enrollment.projectId });
    const allProgress = await MilestoneProgress.find({ projectEnrollmentId: enrollment._id });

    const completedCount = allProgress.filter((p) => p.status === 'completed').length;

    if (completedCount === allMilestones.length && allMilestones.length > 0) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    } else if (completedCount > 0 || status === 'in_progress') {
      if (enrollment.status === 'not_started') {
        enrollment.status = 'in_progress';
      }
    }
    await enrollment.save();

    res.json({
      success: true,
      message: 'Milestone progress updated successfully.',
      progress,
      enrollmentStatus: enrollment.status,
    });
  } catch (error) {
    console.error('Update milestone progress error:', error);
    res.status(500).json({ message: 'Failed to update milestone progress', error: error.message });
  }
});

// @route   POST /api/project-enrollments/:enrollmentId/submissions
// @desc    Submit milestone or full project deliverables (repo URL, demo URL, notes, file upload)
// @access  Private — Authenticated Student
projectEnrollmentRoutes.post('/:enrollmentId/submissions', protect, upload.single('file'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const {
      milestoneId,
      description,
      notes,
      repositoryUrl,
      githubUrl,
      demoUrl,
      liveDemoUrl,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ message: 'Invalid enrollment ID format.' });
    }

    const enrollment = await ProjectEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Project enrollment not found.' });
    }

    if (enrollment.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to submit for this enrollment.' });
    }

    const repo = (repositoryUrl || githubUrl || '').trim();
    const demo = (demoUrl || liveDemoUrl || '').trim();
    const textDesc = (description || notes || '').trim();

    if (repo && !isValidUrl(repo)) {
      return res.status(400).json({
        message: 'Invalid repository URL. Please provide a valid HTTP or HTTPS link.',
      });
    }

    if (demo && !isValidUrl(demo)) {
      return res.status(400).json({
        message: 'Invalid live demo URL. Please provide a valid HTTP or HTTPS link.',
      });
    }

    if (!repo && !demo && !textDesc && !req.file) {
      return res.status(400).json({
        message: 'Please provide at least one deliverable: repository URL, demo URL, description, or file upload.',
      });
    }

    let validMilestoneId = null;
    if (milestoneId && mongoose.Types.ObjectId.isValid(milestoneId)) {
      const milestone = await ProjectMilestone.findOne({
        _id: milestoneId,
        projectId: enrollment.projectId,
      });
      if (!milestone) {
        return res.status(400).json({
          message: 'Milestone does not belong to the project associated with this enrollment.',
        });
      }
      validMilestoneId = milestone._id;
    }

    let fileReference = null;
    if (req.file) {
      const fileValidation = validateProjectFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (!fileValidation.valid) {
        return res.status(400).json({ message: fileValidation.error });
      }

      const storageKey = generateProjectStorageKey(fileValidation.extension);
      const storagePath = path.join(PROJECT_UPLOAD_DIR, storageKey);

      fs.writeFileSync(storagePath, req.file.buffer);

      fileReference = {
        filename: storageKey,
        originalName: sanitizeProjectFilename(req.file.originalname),
        path: storagePath,
        size: req.file.size,
        mimeType: fileValidation.mimeType,
      };
    }

    const submission = await ProjectSubmission.create({
      projectEnrollmentId: enrollment._id,
      projectId: enrollment.projectId,
      studentId: req.user._id,
      milestoneId: validMilestoneId,
      description: textDesc,
      notes: textDesc,
      repositoryUrl: repo,
      githubUrl: repo,
      demoUrl: demo,
      liveDemoUrl: demo,
      fileReference,
      status: 'submitted',
      submittedAt: new Date(),
    });

    if (validMilestoneId) {
      await MilestoneProgress.findOneAndUpdate(
        { projectEnrollmentId: enrollment._id, milestoneId: validMilestoneId },
        { status: 'completed', completedAt: new Date() },
        { upsert: true }
      );
    }

    enrollment.status = 'submitted';
    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Project deliverables submitted successfully! Your submission is now in review.',
      submission,
    });
  } catch (error) {
    console.error('Submit project deliverables error:', error);
    res.status(500).json({ message: 'Failed to submit deliverables', error: error.message });
  }
});

// @route   GET /api/project-enrollments/:enrollmentId/submissions
// @desc    Retrieve authorized submission history for an enrollment
// @access  Private — Enrolled Student or Authorized Instructor/Admin
projectEnrollmentRoutes.get('/:enrollmentId/submissions', protect, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ message: 'Invalid enrollment ID format.' });
    }

    const enrollment = await ProjectEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Project enrollment not found.' });
    }

    const isOwnerStudent = enrollment.studentId.toString() === req.user._id.toString();
    let isAuthorizedInstructor = req.user.role === 'admin';

    if (!isAuthorizedInstructor && req.user.role === 'instructor') {
      const project = await Project.findById(enrollment.projectId);
      if (project) {
        isAuthorizedInstructor = await canManageProject(project, req.user);
      }
    }

    if (!isOwnerStudent && !isAuthorizedInstructor) {
      return res.status(403).json({ message: 'You are not authorized to view these submissions.' });
    }

    const submissions = await ProjectSubmission.find({ projectEnrollmentId: enrollment._id })
      .populate('milestoneId', 'title sequenceOrder')
      .populate('reviewedBy', 'name email avatar')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('Fetch submission history error:', error);
    res.status(500).json({ message: 'Error retrieving submissions', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER 3: /api/project-submissions
// ─────────────────────────────────────────────────────────────────────────────

// @route   PATCH /api/project-submissions/:submissionId/review
// @desc    Review a submission and provide feedback, marks, or revision request
// @access  Private — Instructor or Admin
projectSubmissionRoutes.patch('/:submissionId/review', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksAwarded, grade, feedback, status, rubricScores } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission ID format.' });
    }

    const submission = await ProjectSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const project = await Project.findById(submission.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const isAuthorized = await canManageProject(project, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to review submissions for this project.' });
    }

    const score = marksAwarded !== undefined ? Number(marksAwarded) : grade !== undefined ? Number(grade) : undefined;

    if (score !== undefined) {
      if (isNaN(score) || score < 0 || score > 100) {
        return res.status(400).json({ message: 'Marks awarded must be a number between 0 and 100.' });
      }
      submission.marksAwarded = score;
      submission.grade = score;
    }

    if (feedback !== undefined) {
      submission.feedback = feedback;
    }

    if (Array.isArray(rubricScores)) {
      submission.rubricScores = rubricScores.map((r) => ({
        criteria: r.criteria || 'Evaluation Criteria',
        points: r.points !== undefined ? Number(r.points) : Number(r.pointsAwarded || 0),
        feedback: r.feedback || '',
      }));
    }

    if (status) {
      if (!['graded', 'under_review', 'needs_revision'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Allowed: graded, under_review, needs_revision.' });
      }
      submission.status = status;
    } else if (score !== undefined) {
      submission.status = score >= 70 ? 'graded' : 'needs_revision';
    }

    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    if (submission.projectEnrollmentId) {
      const enrollment = await ProjectEnrollment.findById(submission.projectEnrollmentId);
      if (enrollment) {
        if (submission.status === 'graded') {
          enrollment.status = 'completed';
          enrollment.completedAt = new Date();
        } else if (submission.status === 'needs_revision') {
          enrollment.status = 'needs_revision';
        }
        await enrollment.save();
      }
    }

    res.json({
      success: true,
      message: 'Submission reviewed successfully!',
      submission,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Failed to review submission', error: error.message });
  }
});

// @route   GET /api/project-submissions/:submissionId/download
// @desc    Download submitted deliverable file safely
// @access  Private — Authorized Student or Instructor/Admin
projectSubmissionRoutes.get('/:submissionId/download', protect, async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission ID format.' });
    }

    const submission = await ProjectSubmission.findById(submissionId);
    if (!submission || !submission.fileReference) {
      return res.status(404).json({ message: 'Deliverable file not found.' });
    }

    const isStudent = submission.studentId.toString() === req.user._id.toString();
    let isAuthorized = isStudent || req.user.role === 'admin';

    if (!isAuthorized && req.user.role === 'instructor') {
      const project = await Project.findById(submission.projectId);
      if (project) {
        isAuthorized = await canManageProject(project, req.user);
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to download this file.' });
    }

    const filePath = submission.fileReference.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File is no longer stored on the server.' });
    }

    res.download(filePath, submission.fileReference.originalName);
  } catch (error) {
    console.error('Download deliverable error:', error);
    res.status(500).json({ message: 'Failed to download file', error: error.message });
  }
});

export default projectRouter;

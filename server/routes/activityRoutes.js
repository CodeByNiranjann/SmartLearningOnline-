import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  ProjectActivity,
  ActivityMilestone,
  ActivityAssignment,
  ActivitySubmission,
  Course,
  Module,
  Lesson,
  Enrollment,
} from '../models/index.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';
import {
  PROJECT_UPLOAD_DIR,
  PROJECT_UPLOAD_LIMITS,
  validateProjectFile,
  sanitizeProjectFilename,
  generateProjectStorageKey,
} from '../config/projectUploadConfig.js';

const router = express.Router();
export const activityAssignmentRoutes = express.Router();
export const activitySubmissionRoutes = express.Router();

// Multer memory storage for file deliverables
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: PROJECT_UPLOAD_LIMITS.maxFileSize,
    files: 5,
  },
});

/**
 * Validate URL helper
 */
const isValidUrl = (string) => {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Check if a user is authorized to manage a project activity
 */
export const canManageActivity = async (activity, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'instructor') return false;
  if (activity.trainer && activity.trainer.toString() === user._id.toString()) return true;
  if (activity.course) {
    const course = await Course.findById(activity.course);
    if (course && canManageCourse(course, user)) return true;
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRAINER ACTIVITY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/activities/trainer
// @desc    List all activities managed by the authenticated trainer
// @access  Instructor / Admin
router.get('/trainer', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.$or = [{ trainer: req.user._id }];
      const taughtCourses = await Course.find({
        $or: [
          { instructorId: req.user._id },
          { instructor: req.user.name },
          { instructor: req.user._id.toString() },
        ],
      }).select('_id');
      if (taughtCourses.length > 0) {
        filter.$or.push({ course: { $in: taughtCourses.map((c) => c._id) } });
      }
    }

    const activities = await ProjectActivity.find(filter)
      .populate('course', 'title thumbnail category difficulty')
      .populate('module', 'title')
      .populate('lesson', 'title')
      .populate('trainer', 'name email avatar')
      .sort({ createdAt: -1 });

    const activityIds = activities.map((a) => a._id);

    // Aggregate assignment and submission counts
    const [assignments, submissions, milestones] = await Promise.all([
      ActivityAssignment.find({ activity: { $in: activityIds } }),
      ActivitySubmission.find({ activity: { $in: activityIds } }),
      ActivityMilestone.find({ activity: { $in: activityIds } }),
    ]);

    const enriched = activities.map((act) => {
      const actAssignments = assignments.filter(
        (asg) => asg.activity.toString() === act._id.toString()
      );
      const actSubmissions = submissions.filter(
        (sub) => sub.activity.toString() === act._id.toString()
      );
      const actMilestones = milestones.filter(
        (m) => m.activity.toString() === act._id.toString()
      );

      const pendingReviews = actSubmissions.filter((s) => s.status === 'submitted').length;
      const completedStudents = actAssignments.filter((a) => a.status === 'completed').length;

      return {
        ...act.toObject(),
        enrolledCount: actAssignments.length,
        submissionsCount: actSubmissions.length,
        pendingReviews,
        completedCount: completedStudents,
        milestonesCount: actMilestones.length,
      };
    });

    res.json({ success: true, activities: enriched });
  } catch (error) {
    console.error('Error fetching trainer activities:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve trainer activities', error: error.message });
  }
});

// @route   POST /api/courses/:courseId/activities  (also handles POST /api/activities)
// @desc    Create a project activity for a course
// @access  Instructor / Admin
router.post('/course/:courseId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  createActivityHandler(req, res);
});

export const createActivityHandler = async (req, res) => {
  try {
    const courseId = req.params.courseId || req.body.course || req.body.courseId;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Valid course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Associated course not found' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to create activities for this course' });
    }

    const {
      title,
      description,
      problemStatement,
      learningObjectives,
      instructions,
      category,
      difficulty,
      requiredSkills,
      technologyStack,
      estimatedDuration,
      module: moduleId,
      lesson: lessonId,
      activityType,
      startDate,
      dueDate,
      deliverables,
      maximumMarks,
      passingMarks,
      gradingRubric,
      allowResubmission,
      status,
      milestones,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Activity title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Short description is required' });
    }

    // Validate module and lesson relationships if provided
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      const moduleDoc = await Module.findOne({ _id: moduleId, courseId: course._id });
      if (!moduleDoc) {
        return res.status(400).json({ success: false, message: 'Module does not belong to the selected course' });
      }
    }

    if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
      const lessonDoc = await Lesson.findById(lessonId);
      if (!lessonDoc) {
        return res.status(400).json({ success: false, message: 'Lesson does not exist' });
      }
    }

    // Validate marks
    const maxMarks = maximumMarks !== undefined ? Number(maximumMarks) : 100;
    const passMarks = passingMarks !== undefined ? Number(passingMarks) : 50;

    if (isNaN(maxMarks) || maxMarks <= 0) {
      return res.status(400).json({ success: false, message: 'Maximum marks must be a positive number' });
    }
    if (isNaN(passMarks) || passMarks < 0 || passMarks > maxMarks) {
      return res.status(400).json({ success: false, message: 'Passing marks must be between 0 and maximum marks' });
    }

    // Validate dates if provided
    if (startDate && dueDate) {
      if (new Date(startDate) > new Date(dueDate)) {
        return res.status(400).json({ success: false, message: 'Start date cannot be after due date' });
      }
    }

    const activity = new ProjectActivity({
      title: title.trim(),
      description: description.trim(),
      problemStatement: problemStatement?.trim() || '',
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives.filter(Boolean) : [],
      instructions: instructions || '',
      category: category?.trim() || course.category || 'General',
      difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty) ? difficulty : 'Intermediate',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.filter(Boolean) : [],
      technologyStack: Array.isArray(technologyStack) ? technologyStack.filter(Boolean) : [],
      estimatedDuration: estimatedDuration?.trim() || '4 hours',
      course: course._id,
      module: moduleId && mongoose.Types.ObjectId.isValid(moduleId) ? moduleId : null,
      lesson: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : null,
      trainer: req.user._id,
      activityType: activityType === 'group' ? 'group' : 'individual',
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      deliverables: Array.isArray(deliverables) ? deliverables.filter(Boolean) : [],
      maximumMarks: maxMarks,
      passingMarks: passMarks,
      gradingRubric: Array.isArray(gradingRubric) ? gradingRubric : [],
      allowResubmission: allowResubmission !== undefined ? Boolean(allowResubmission) : true,
      status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
    });

    await activity.save();

    // Create initial milestones if supplied
    let createdMilestones = [];
    if (Array.isArray(milestones) && milestones.length > 0) {
      const milestoneDocs = milestones.map((m, idx) => ({
        activity: activity._id,
        title: m.title || `Milestone ${idx + 1}`,
        description: m.description || '',
        sequenceOrder: m.sequenceOrder || idx + 1,
        dueDate: m.dueDate ? new Date(m.dueDate) : null,
        expectedDeliverables: Array.isArray(m.expectedDeliverables)
          ? m.expectedDeliverables
          : Array.isArray(m.requiredDeliverables)
          ? m.requiredDeliverables
          : [],
        requiredDeliverables: Array.isArray(m.requiredDeliverables)
          ? m.requiredDeliverables
          : Array.isArray(m.expectedDeliverables)
          ? m.expectedDeliverables
          : [],
        completionRequirements: m.completionRequirements || '',
      }));
      createdMilestones = await ActivityMilestone.insertMany(milestoneDocs);
    }

    res.status(201).json({
      success: true,
      activity,
      milestones: createdMilestones,
      message: 'Project-based activity created successfully',
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, message: 'Failed to create activity', error: error.message });
  }
};

router.post('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  createActivityHandler(req, res);
});

// @route   GET /api/activities
// @desc    List published activities available to students (with filters & user assignment status)
// @access  Public / Optional Protect
router.get('/', optionalProtect, async (req, res) => {
  try {
    const { courseId, category, difficulty, search, technology, status } = req.query;

    const filter = {};

    if (status && (req.user?.role === 'admin' || req.user?.role === 'instructor')) {
      filter.status = status;
    } else {
      filter.status = 'published';
    }

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.course = courseId;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (technology && technology !== 'All') {
      filter.technologyStack = { $in: [new RegExp(technology.trim(), 'i')] };
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { technologyStack: { $in: [new RegExp(term, 'i')] } },
        { requiredSkills: { $in: [new RegExp(term, 'i')] } },
      ];
    }

    const activities = await ProjectActivity.find(filter)
      .populate('course', 'title thumbnail category difficulty')
      .populate('module', 'title')
      .populate('lesson', 'title')
      .populate('trainer', 'name email avatar')
      .sort({ createdAt: -1 });

    let assignmentsMap = {};
    if (req.user) {
      const activityIds = activities.map((a) => a._id);
      const userAssignments = await ActivityAssignment.find({
        activity: { $in: activityIds },
        student: req.user._id,
      });

      userAssignments.forEach((asg) => {
        assignmentsMap[asg.activity.toString()] = asg;
      });
    }

    const enriched = activities.map((act) => {
      const userAsg = assignmentsMap[act._id.toString()] || null;
      return {
        ...act.toObject(),
        assignment: userAsg,
        studentStatus: userAsg ? userAsg.status : 'not_started',
        overallProgress: userAsg ? userAsg.overallProgress : 0,
      };
    });

    res.json({ success: true, activities: enriched });
  } catch (error) {
    console.error('Error listing activities:', error);
    res.status(500).json({ success: false, message: 'Failed to list activities', error: error.message });
  }
});

// @route   GET /api/activities/:activityId
// @desc    Get detailed activity view
// @access  Public / Optional Protect
router.get('/:activityId', optionalProtect, async (req, res) => {
  try {
    const { activityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: 'Invalid activity ID' });
    }

    const activity = await ProjectActivity.findById(activityId)
      .populate('course', 'title thumbnail category difficulty duration')
      .populate('module', 'title')
      .populate('lesson', 'title')
      .populate('trainer', 'name email avatar');

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    // Check publication authorization if draft
    if (activity.status !== 'published') {
      const canManage = await canManageActivity(activity, req.user);
      if (!canManage) {
        return res.status(403).json({ success: false, message: 'This activity is not currently published' });
      }
    }

    const milestones = await ActivityMilestone.find({ activity: activity._id }).sort({
      sequenceOrder: 1,
    });

    let assignment = null;
    let submissions = [];

    if (req.user) {
      assignment = await ActivityAssignment.findOne({
        activity: activity._id,
        student: req.user._id,
      }).populate('milestoneProgress.milestone');

      if (assignment) {
        submissions = await ActivitySubmission.find({
          activityAssignment: assignment._id,
        })
          .sort({ attemptNumber: -1 })
          .populate('reviewedBy', 'name email avatar');
      }
    }

    res.json({
      success: true,
      activity,
      milestones,
      assignment,
      submissions,
      latestSubmission: submissions[0] || null,
    });
  } catch (error) {
    console.error('Error fetching activity details:', error);
    res.status(500).json({ success: false, message: 'Failed to get activity details', error: error.message });
  }
});

// @route   PUT /api/activities/:activityId
// @desc    Update project activity
// @access  Instructor / Admin
router.put('/:activityId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: 'Invalid activity ID' });
    }

    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this activity' });
    }

    const {
      title,
      description,
      problemStatement,
      learningObjectives,
      instructions,
      category,
      difficulty,
      requiredSkills,
      technologyStack,
      estimatedDuration,
      module: moduleId,
      lesson: lessonId,
      activityType,
      startDate,
      dueDate,
      deliverables,
      maximumMarks,
      passingMarks,
      gradingRubric,
      allowResubmission,
      status,
    } = req.body;

    if (title !== undefined) activity.title = title.trim();
    if (description !== undefined) activity.description = description.trim();
    if (problemStatement !== undefined) activity.problemStatement = problemStatement.trim();
    if (learningObjectives !== undefined) activity.learningObjectives = learningObjectives;
    if (instructions !== undefined) activity.instructions = instructions;
    if (category !== undefined) activity.category = category.trim();
    if (difficulty !== undefined && ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      activity.difficulty = difficulty;
    }
    if (requiredSkills !== undefined) activity.requiredSkills = requiredSkills;
    if (technologyStack !== undefined) activity.technologyStack = technologyStack;
    if (estimatedDuration !== undefined) activity.estimatedDuration = estimatedDuration.trim();
    if (activityType !== undefined) activity.activityType = activityType;
    if (startDate !== undefined) activity.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) activity.dueDate = dueDate ? new Date(dueDate) : null;
    if (deliverables !== undefined) activity.deliverables = deliverables;
    if (gradingRubric !== undefined) activity.gradingRubric = gradingRubric;
    if (allowResubmission !== undefined) activity.allowResubmission = Boolean(allowResubmission);
    if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) {
      activity.status = status;
    }

    if (maximumMarks !== undefined) {
      const maxMarks = Number(maximumMarks);
      if (isNaN(maxMarks) || maxMarks <= 0) {
        return res.status(400).json({ success: false, message: 'Maximum marks must be a positive number' });
      }
      activity.maximumMarks = maxMarks;
    }

    if (passingMarks !== undefined) {
      const passMarks = Number(passingMarks);
      if (isNaN(passMarks) || passMarks < 0 || passMarks > activity.maximumMarks) {
        return res.status(400).json({ success: false, message: 'Passing marks must be between 0 and maximum marks' });
      }
      activity.passingMarks = passMarks;
    }

    if (activity.startDate && activity.dueDate && activity.startDate > activity.dueDate) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after due date' });
    }

    if (moduleId !== undefined) {
      if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
        const moduleDoc = await Module.findOne({ _id: moduleId, courseId: activity.course });
        if (!moduleDoc) {
          return res.status(400).json({ success: false, message: 'Module does not belong to the activity course' });
        }
        activity.module = moduleId;
      } else {
        activity.module = null;
      }
    }

    if (lessonId !== undefined) {
      if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
        activity.lesson = lessonId;
      } else {
        activity.lesson = null;
      }
    }

    await activity.save();

    res.json({
      success: true,
      activity,
      message: 'Activity updated successfully',
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ success: false, message: 'Failed to update activity', error: error.message });
  }
});

// @route   DELETE /api/activities/:activityId
// @desc    Delete project activity
// @access  Instructor / Admin
router.delete('/:activityId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this activity' });
    }

    await Promise.all([
      ProjectActivity.findByIdAndDelete(activityId),
      ActivityMilestone.deleteMany({ activity: activityId }),
      ActivityAssignment.deleteMany({ activity: activityId }),
      ActivitySubmission.deleteMany({ activity: activityId }),
    ]);

    res.json({ success: true, message: 'Activity and associated records deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ success: false, message: 'Failed to delete activity', error: error.message });
  }
});

// @route   PATCH /api/activities/:activityId/status
// @desc    Publish, unpublish, or archive activity
// @access  Instructor / Admin
router.patch('/:activityId/status', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be draft, published, or archived' });
    }

    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this activity' });
    }

    activity.status = status;
    await activity.save();

    res.json({ success: true, activity, message: `Activity status updated to ${status}` });
  } catch (error) {
    console.error('Error changing activity status:', error);
    res.status(500).json({ success: false, message: 'Failed to update activity status', error: error.message });
  }
});

// @route   POST /api/activities/:activityId/milestones
// @desc    Add milestone to activity
// @access  Instructor / Admin
router.post('/:activityId/milestones', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to add milestones' });
    }

    const {
      title,
      description,
      sequenceOrder,
      dueDate,
      expectedDeliverables,
      requiredDeliverables,
      completionRequirements,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Milestone title is required' });
    }

    let order = sequenceOrder;
    if (!order) {
      const highest = await ActivityMilestone.findOne({ activity: activity._id }).sort({
        sequenceOrder: -1,
      });
      order = highest ? highest.sequenceOrder + 1 : 1;
    }

    const deliverables = Array.isArray(expectedDeliverables)
      ? expectedDeliverables
      : Array.isArray(requiredDeliverables)
      ? requiredDeliverables
      : [];

    const milestone = new ActivityMilestone({
      activity: activity._id,
      title: title.trim(),
      description: description?.trim() || '',
      sequenceOrder: order,
      dueDate: dueDate ? new Date(dueDate) : null,
      expectedDeliverables: deliverables,
      requiredDeliverables: deliverables,
      completionRequirements: completionRequirements?.trim() || '',
    });

    await milestone.save();

    // Propagate milestone to existing active assignments so students see the new task
    await ActivityAssignment.updateMany(
      { activity: activity._id, 'milestoneProgress.milestone': { $ne: milestone._id } },
      {
        $push: {
          milestoneProgress: {
            milestone: milestone._id,
            completed: false,
            completedAt: null,
            notes: '',
          },
        },
      }
    );

    res.status(201).json({ success: true, milestone, message: 'Milestone created successfully' });
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ success: false, message: 'Failed to create milestone', error: error.message });
  }
});

// @route   PUT /api/activities/:activityId/milestones/:milestoneId
// @desc    Update milestone
// @access  Instructor / Admin
router.put('/:activityId/milestones/:milestoneId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId, milestoneId } = req.params;
    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to update milestones' });
    }

    const milestone = await ActivityMilestone.findOne({ _id: milestoneId, activity: activity._id });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found for this activity' });
    }

    const {
      title,
      description,
      sequenceOrder,
      dueDate,
      expectedDeliverables,
      requiredDeliverables,
      completionRequirements,
    } = req.body;

    if (title !== undefined) milestone.title = title.trim();
    if (description !== undefined) milestone.description = description.trim();
    if (sequenceOrder !== undefined) milestone.sequenceOrder = Number(sequenceOrder);
    if (dueDate !== undefined) milestone.dueDate = dueDate ? new Date(dueDate) : null;
    if (completionRequirements !== undefined) milestone.completionRequirements = completionRequirements.trim();

    const deliverables = Array.isArray(expectedDeliverables)
      ? expectedDeliverables
      : Array.isArray(requiredDeliverables)
      ? requiredDeliverables
      : null;

    if (deliverables !== null) {
      milestone.expectedDeliverables = deliverables;
      milestone.requiredDeliverables = deliverables;
    }

    await milestone.save();

    res.json({ success: true, milestone, message: 'Milestone updated successfully' });
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ success: false, message: 'Failed to update milestone', error: error.message });
  }
});

// @route   DELETE /api/activities/:activityId/milestones/:milestoneId
// @desc    Delete milestone
// @access  Instructor / Admin
router.delete('/:activityId/milestones/:milestoneId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId, milestoneId } = req.params;
    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete milestones' });
    }

    await ActivityMilestone.findOneAndDelete({ _id: milestoneId, activity: activity._id });

    // Remove milestone from assignments
    await ActivityAssignment.updateMany(
      { activity: activity._id },
      { $pull: { milestoneProgress: { milestone: milestoneId } } }
    );

    res.json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ success: false, message: 'Failed to delete milestone', error: error.message });
  }
});

// @route   GET /api/activities/:activityId/assignments
// @desc    List student assignments and progress for this activity
// @access  Instructor / Admin
router.get('/:activityId/assignments', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view student assignments' });
    }

    const assignments = await ActivityAssignment.find({ activity: activity._id })
      .populate('student', 'name email avatar')
      .populate('milestoneProgress.milestone', 'title sequenceOrder')
      .sort({ createdAt: -1 });

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await ActivitySubmission.find({ activityAssignment: { $in: assignmentIds } })
      .sort({ attemptNumber: -1 })
      .populate('reviewedBy', 'name email avatar');

    const enriched = assignments.map((asg) => {
      const asgSubmissions = submissions.filter(
        (s) => s.activityAssignment.toString() === asg._id.toString()
      );
      return {
        ...asg.toObject(),
        submissionsCount: asgSubmissions.length,
        latestSubmission: asgSubmissions[0] || null,
        submissions: asgSubmissions,
      };
    });

    res.json({ success: true, assignments: enriched });
  } catch (error) {
    console.error('Error fetching activity assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve assignments', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. STUDENT ACTIVITY WORKFLOW ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/activities/:activityId/start
// @desc    Start an activity or retrieve existing assignment
// @access  Student / Authenticated
router.post('/:activityId/start', protect, async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await ProjectActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    if (activity.status !== 'published') {
      const isAuthorized = await canManageActivity(activity, req.user);
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'This activity is not yet published' });
      }
    }

    // Check existing assignment
    let assignment = await ActivityAssignment.findOne({
      activity: activity._id,
      student: req.user._id,
    });

    if (assignment) {
      return res.json({
        success: true,
        assignment,
        message: 'Existing activity assignment retrieved',
      });
    }

    // Optional enrollment check
    let enrollmentDoc = null;
    if (activity.course) {
      enrollmentDoc = await Enrollment.findOne({
        course: activity.course,
        student: req.user._id,
      });
    }

    const milestones = await ActivityMilestone.find({ activity: activity._id }).sort({ sequenceOrder: 1 });

    const initialMilestoneProgress = milestones.map((m) => ({
      milestone: m._id,
      completed: false,
      completedAt: null,
      notes: '',
    }));

    assignment = new ActivityAssignment({
      activity: activity._id,
      student: req.user._id,
      enrollment: enrollmentDoc ? enrollmentDoc._id : null,
      status: 'in_progress',
      milestoneProgress: initialMilestoneProgress,
      overallProgress: 0,
      startedAt: new Date(),
    });

    await assignment.save();

    res.status(201).json({
      success: true,
      assignment,
      message: 'Activity started successfully. Happy learning!',
    });
  } catch (error) {
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      const existing = await ActivityAssignment.findOne({
        activity: req.params.activityId,
        student: req.user._id,
      });
      return res.json({
        success: true,
        assignment: existing,
        message: 'Existing assignment retrieved',
      });
    }
    console.error('Error starting activity:', error);
    res.status(500).json({ success: false, message: 'Failed to start activity', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACTIVITY ASSIGNMENT & SUBMISSION ROUTES (Mounted on dedicated subrouters)
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/activity-assignments/:assignmentId
// @desc    Get student assignment progress
// @access  Authenticated
activityAssignmentRoutes.get('/:assignmentId', protect, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await ActivityAssignment.findById(assignmentId)
      .populate('activity')
      .populate('student', 'name email avatar')
      .populate('milestoneProgress.milestone');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Authorization: Must be student who owns assignment or trainer/admin
    const isOwner = assignment.student._id.toString() === req.user._id.toString();
    const isTrainerOrAdmin =
      req.user.role === 'admin' ||
      (req.user.role === 'instructor' && (await canManageActivity(assignment.activity, req.user)));

    if (!isOwner && !isTrainerOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this assignment' });
    }

    const submissions = await ActivitySubmission.find({ activityAssignment: assignment._id })
      .sort({ attemptNumber: -1 })
      .populate('reviewedBy', 'name email avatar');

    res.json({
      success: true,
      assignment,
      submissions,
      latestSubmission: submissions[0] || null,
    });
  } catch (error) {
    console.error('Error retrieving assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve assignment', error: error.message });
  }
});

// @route   PATCH /api/activity-assignments/:assignmentId/progress
// @desc    Update milestone progress
// @access  Student (Owner)
activityAssignmentRoutes.patch('/:assignmentId/progress', protect, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { milestoneId, completed, notes } = req.body;

    const assignment = await ActivityAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment progress' });
    }

    if (!milestoneId || !mongoose.Types.ObjectId.isValid(milestoneId)) {
      return res.status(400).json({ success: false, message: 'Valid milestoneId is required' });
    }

    // Validate milestone belongs to this activity
    const milestoneDoc = await ActivityMilestone.findOne({
      _id: milestoneId,
      activity: assignment.activity,
    });

    if (!milestoneDoc) {
      return res.status(400).json({ success: false, message: 'Milestone does not belong to this activity' });
    }

    let item = assignment.milestoneProgress.find(
      (m) => m.milestone.toString() === milestoneId.toString()
    );

    if (!item) {
      assignment.milestoneProgress.push({
        milestone: milestoneId,
        completed: Boolean(completed),
        completedAt: completed ? new Date() : null,
        notes: notes || '',
      });
    } else {
      if (completed !== undefined) {
        item.completed = Boolean(completed);
        item.completedAt = completed ? new Date() : null;
      }
      if (notes !== undefined) {
        item.notes = notes.trim();
      }
    }

    // Recalculate overallProgress without double-counting
    const totalMilestones = await ActivityMilestone.countDocuments({ activity: assignment.activity });
    const completedCount = assignment.milestoneProgress.filter((m) => m.completed).length;

    assignment.overallProgress =
      totalMilestones > 0 ? Math.min(100, Math.round((completedCount / totalMilestones) * 100)) : 0;

    if (assignment.status === 'not_started') {
      assignment.status = 'in_progress';
      assignment.startedAt = new Date();
    }

    await assignment.save();

    res.json({
      success: true,
      assignment,
      overallProgress: assignment.overallProgress,
      message: 'Milestone progress updated successfully',
    });
  } catch (error) {
    console.error('Error updating assignment progress:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress', error: error.message });
  }
});

// @route   POST /api/activity-assignments/:assignmentId/submissions
// @desc    Submit work (text, repository URL, demo URL, uploaded files)
// @access  Student (Owner)
activityAssignmentRoutes.post('/:assignmentId/submissions', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await ActivityAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to submit for this assignment' });
    }

    const activity = await ProjectActivity.findById(assignment.activity);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Associated activity not found' });
    }

    // Check if past submissions exist and if resubmission is allowed
    const previousSubmissions = await ActivitySubmission.find({ activityAssignment: assignment._id }).sort({
      attemptNumber: -1,
    });

    if (previousSubmissions.length > 0 && !activity.allowResubmission) {
      return res.status(400).json({
        success: false,
        message: 'Resubmissions are not permitted for this project activity',
      });
    }

    const { textResponse, repositoryUrl, demoUrl, milestoneId } = req.body;

    // Validate URLs
    if (repositoryUrl && !isValidUrl(repositoryUrl)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid repository URL' });
    }
    if (demoUrl && !isValidUrl(demoUrl)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid live demo URL' });
    }

    // Process attached files
    const fileReferences = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const validation = validateProjectFile(file);
        if (!validation.isValid) {
          return res.status(400).json({ success: false, message: validation.error });
        }

        const safeFilename = generateProjectStorageKey(file.originalname);
        const diskPath = path.join(PROJECT_UPLOAD_DIR, safeFilename);

        // Write safely to disk
        fs.writeFileSync(diskPath, file.buffer);

        fileReferences.push({
          filename: safeFilename,
          originalName: sanitizeProjectFilename(file.originalname),
          path: diskPath,
          size: file.size,
          mimeType: file.mimetype,
        });
      }
    }

    // Ensure at least one deliverable is provided
    const hasText = textResponse && textResponse.trim().length > 0;
    const hasRepo = Boolean(repositoryUrl && repositoryUrl.trim());
    const hasDemo = Boolean(demoUrl && demoUrl.trim());
    const hasFiles = fileReferences.length > 0;

    if (!hasText && !hasRepo && !hasDemo && !hasFiles) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one deliverable: text response, repository URL, demo URL, or file attachment',
      });
    }

    const attemptNumber = (previousSubmissions[0]?.attemptNumber || 0) + 1;

    const submission = new ActivitySubmission({
      activityAssignment: assignment._id,
      activity: activity._id,
      student: req.user._id,
      milestone: milestoneId && mongoose.Types.ObjectId.isValid(milestoneId) ? milestoneId : null,
      attemptNumber,
      textResponse: textResponse?.trim() || '',
      repositoryUrl: repositoryUrl?.trim() || '',
      demoUrl: demoUrl?.trim() || '',
      fileReferences,
      status: 'submitted',
      submittedAt: new Date(),
    });

    await submission.save();

    // Update assignment status
    assignment.status = 'submitted';
    await assignment.save();

    res.status(201).json({
      success: true,
      submission,
      attemptNumber,
      message: `Attempt #${attemptNumber} submitted successfully! Your trainer will review it soon.`,
    });
  } catch (error) {
    console.error('Error submitting activity deliverable:', error);
    res.status(500).json({ success: false, message: 'Failed to submit deliverables', error: error.message });
  }
});

// @route   GET /api/activity-assignments/:assignmentId/submissions
// @desc    Get submission attempt history for assignment
// @access  Authenticated
activityAssignmentRoutes.get('/:assignmentId/submissions', protect, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await ActivityAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const isOwner = assignment.student.toString() === req.user._id.toString();
    const isTrainerOrAdmin =
      req.user.role === 'admin' ||
      (req.user.role === 'instructor' && (await canManageActivity({ _id: assignment.activity }, req.user)));

    if (!isOwner && !isTrainerOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view submission history' });
    }

    const submissions = await ActivitySubmission.find({ activityAssignment: assignment._id })
      .sort({ attemptNumber: -1 })
      .populate('reviewedBy', 'name email avatar')
      .populate('milestone', 'title sequenceOrder');

    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve submission history', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUBMISSION REVIEW & FILE DOWNLOAD ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @route   PATCH /api/activity-submissions/:submissionId/review
// @desc    Grade submission and provide trainer feedback
// @access  Instructor / Admin
activitySubmissionRoutes.patch('/:submissionId/review', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await ActivitySubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const activity = await ProjectActivity.findById(submission.activity);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const isAuthorized = await canManageActivity(activity, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to grade this submission' });
    }

    const { marksAwarded, trainerFeedback, rubricScores, status } = req.body;

    if (marksAwarded !== undefined) {
      const marks = Number(marksAwarded);
      if (isNaN(marks) || marks < 0 || marks > activity.maximumMarks) {
        return res.status(400).json({
          success: false,
          message: `Marks awarded must be between 0 and maximum marks (${activity.maximumMarks})`,
        });
      }
      submission.marksAwarded = marks;
    }

    if (trainerFeedback !== undefined) {
      submission.trainerFeedback = trainerFeedback.trim();
    }

    if (Array.isArray(rubricScores)) {
      submission.rubricScores = rubricScores;
    }

    const reviewStatus = ['completed', 'needs_revision', 'under_review'].includes(status)
      ? status
      : submission.marksAwarded >= activity.passingMarks
      ? 'completed'
      : 'needs_revision';

    submission.status = reviewStatus;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    await submission.save();

    // Synchronize parent assignment status
    const assignment = await ActivityAssignment.findById(submission.activityAssignment);
    if (assignment) {
      if (reviewStatus === 'completed') {
        assignment.status = 'completed';
        assignment.completedAt = new Date();
      } else if (reviewStatus === 'needs_revision') {
        assignment.status = 'needs_revision';
      }
      await assignment.save();
    }

    res.json({
      success: true,
      submission,
      assignmentStatus: assignment?.status,
      message: 'Submission successfully evaluated and feedback recorded',
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ success: false, message: 'Failed to record review', error: error.message });
  }
});

// @route   GET /api/activity-submissions/:submissionId/download/:fileIndex
// @desc    Securely download submission attachment
// @access  Authenticated (Student owner, Trainer, Admin)
activitySubmissionRoutes.get('/:submissionId/download/:fileIndex', protect, async (req, res) => {
  try {
    const { submissionId, fileIndex } = req.params;
    const submission = await ActivitySubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const idx = parseInt(fileIndex, 10);
    if (isNaN(idx) || !submission.fileReferences || !submission.fileReferences[idx]) {
      return res.status(404).json({ success: false, message: 'File attachment not found' });
    }

    const fileRef = submission.fileReferences[idx];

    // Check authorization: must be student who submitted or instructor/admin
    const isOwner = submission.student.toString() === req.user._id.toString();
    const isTrainerOrAdmin =
      req.user.role === 'admin' ||
      (req.user.role === 'instructor' && (await canManageActivity({ _id: submission.activity }, req.user)));

    if (!isOwner && !isTrainerOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this submission file' });
    }

    if (!fs.existsSync(fileRef.path)) {
      return res.status(404).json({ success: false, message: 'File not found on storage server' });
    }

    res.download(fileRef.path, fileRef.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, message: 'Failed to download file', error: error.message });
  }
});

export default router;

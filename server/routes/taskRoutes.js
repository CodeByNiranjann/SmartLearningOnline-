import express from 'express';
import Task from '../models/Task.js';
import TaskSubmission from '../models/TaskSubmission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

// Helper: verify if user can manage a course's tasks (instructor owner or admin)
function canManageCourse(course, user) {
  if (!course) return false;
  if (user.role === 'admin') return true;
  const instructorId = course.instructorId?.toString() || course.instructor?.toString();
  return instructorId === user._id.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks
// @desc    Instructor/admin: list tasks for their own courses (paginated)
//          Student: list published tasks from enrolled courses
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;
    const { courseId, status, search } = req.query;

    let query = {};

    if (req.user.role === 'admin') {
      if (courseId) query.course = courseId;
      if (status && status !== 'all') query.status = status;
    } else if (req.user.role === 'instructor') {
      // Scope to instructor's own courses
      const myCourses = await Course.find({ instructorId: req.user._id }).select('_id');
      const myCourseIds = myCourses.map((c) => c._id);
      query.course = courseId && myCourseIds.some(id => id.toString() === courseId)
        ? courseId
        : { $in: myCourseIds };
      if (status && status !== 'all') query.status = status;
    } else {
      // Student: published tasks from enrolled courses only
      const [enrollments, progressRecords] = await Promise.all([
        Enrollment.find({ userId: req.user._id, status: { $in: ['active', 'completed'] } }).select('courseId'),
        Progress.find({ userId: req.user._id }).select('courseId'),
      ]);
      const enrolled = new Set([
        ...enrollments.map(e => e.courseId?.toString()),
        ...progressRecords.map(p => p.courseId?.toString()),
      ].filter(Boolean));
      if (enrolled.size === 0) {
        return res.json({ tasks: [], total: 0, page, limit, totalPages: 0 });
      }
      query.course = courseId && enrolled.has(courseId) ? courseId : { $in: Array.from(enrolled) };
      query.status = 'published';
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('course', 'title thumbnail category')
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // For students: attach their submission status
    let tasksWithStatus = tasks;
    if (req.user.role === 'student') {
      const taskIds = tasks.map(t => t._id);
      const mySubmissions = await TaskSubmission.find({
        task: { $in: taskIds },
        student: req.user._id,
      }).select('task status score feedback gradedAt');

      const submissionMap = {};
      mySubmissions.forEach(s => { submissionMap[s.task.toString()] = s; });

      tasksWithStatus = tasks.map(t => ({
        ...t.toObject(),
        mySubmission: submissionMap[t._id.toString()] || null,
      }));
    }

    res.json({ tasks: tasksWithStatus, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/:id
// @desc    Get a single task with submission info (student) or submissions list (instructor)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('course', 'title thumbnail category instructorId')
      .populate('instructor', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (req.user.role === 'student') {
      if (task.status !== 'published') {
        return res.status(403).json({ message: 'Task is not available.' });
      }
      const mySubmission = await TaskSubmission.findOne({
        task: task._id,
        student: req.user._id,
      });
      return res.json({ task, mySubmission });
    }

    if (!canManageCourse(task.course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to view this task.' });
    }

    const submissions = await TaskSubmission.find({ task: task._id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({ task, submissions });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Error retrieving task.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks
// @desc    Instructor creates a task for their course
// @access  Private — instructor or admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, instructions, courseId, maxPoints, dueDate, taskType, status, allowLateSubmissions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required.' });
    }
    if (!courseId) {
      return res.status(400).json({ message: 'Course selection is required.' });
    }
    if (!maxPoints || isNaN(maxPoints) || Number(maxPoints) < 1) {
      return res.status(400).json({ message: 'Maximum points must be at least 1.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to add tasks to this course.' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      instructions: instructions ? instructions.trim() : '',
      course: course._id,
      instructor: req.user._id,
      maxPoints: Number(maxPoints),
      dueDate: dueDate ? new Date(dueDate) : null,
      taskType: taskType || 'mixed',
      status: ['draft', 'published', 'archived'].includes(status) ? status : 'published',
      allowLateSubmissions: typeof allowLateSubmissions === 'boolean' ? allowLateSubmissions : true,
    });

    const populated = await Task.findById(task._id)
      .populate('course', 'title thumbnail category')
      .populate('instructor', 'name email');

    res.status(201).json({ message: 'Task created successfully.', task: populated });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tasks/:id
// @desc    Instructor updates a task
// @access  Private — instructor (owner) or admin
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('course', 'title instructorId');
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    if (!canManageCourse(task.course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to edit this task.' });
    }

    const { title, description, instructions, maxPoints, dueDate, taskType, status, allowLateSubmissions } = req.body;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (instructions !== undefined) task.instructions = instructions;
    if (maxPoints !== undefined && !isNaN(maxPoints) && Number(maxPoints) >= 1) task.maxPoints = Number(maxPoints);
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (taskType !== undefined) task.taskType = taskType;
    if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) task.status = status;
    if (typeof allowLateSubmissions === 'boolean') task.allowLateSubmissions = allowLateSubmissions;

    await task.save();
    const populated = await Task.findById(task._id)
      .populate('course', 'title thumbnail category')
      .populate('instructor', 'name email');

    res.json({ message: 'Task updated successfully.', task: populated });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// @desc    Instructor deletes a task and all its submissions
// @access  Private — instructor (owner) or admin
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('course', 'title instructorId');
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    if (!canManageCourse(task.course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to delete this task.' });
    }

    await TaskSubmission.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(task._id);

    res.json({ message: `Task "${task.title}" deleted successfully.` });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks/:id/submit
// @desc    Student submits work for a task (idempotent upsert)
// @access  Private — student only
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/submit', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Administrators cannot submit task assignments.' });
    }
    if (req.user.role === 'instructor') {
      return res.status(403).json({ message: 'Instructors cannot submit task assignments.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    if (task.status !== 'published') {
      return res.status(403).json({ message: 'This task is not currently accepting submissions.' });
    }

    const { textContent, submissionLink, fileUrl } = req.body;

    if (!textContent?.trim() && !submissionLink?.trim() && !fileUrl?.trim()) {
      return res.status(400).json({ message: 'At least one of: text content, submission link, or file URL is required.' });
    }

    // Check existing submission
    const existing = await TaskSubmission.findOne({ task: task._id, student: req.user._id });
    if (existing && existing.status === 'graded') {
      return res.status(200).json({
        message: 'This task has already been graded and cannot be resubmitted.',
        submission: existing,
        alreadyGraded: true,
      });
    }

    // Upsert submission
    const submission = await TaskSubmission.findOneAndUpdate(
      { task: task._id, student: req.user._id },
      {
        course: task.course,
        textContent: textContent ? textContent.trim() : '',
        submissionLink: submissionLink ? submissionLink.trim() : '',
        fileUrl: fileUrl ? fileUrl.trim() : '',
        status: 'submitted',
        submittedAt: new Date(),
        score: null,
        feedback: '',
        gradedAt: null,
        gradedBy: null,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: 'Task submitted successfully!',
      submission,
    });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ message: 'Error submitting task: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/:id/submissions
// @desc    Instructor lists all submissions for a task (paginated)
// @access  Private — instructor (owner) or admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/submissions', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('course', 'title instructorId');
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    if (!canManageCourse(task.course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to view these submissions.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const query = { task: task._id };
    if (status && status !== 'all') query.status = status;

    const total = await TaskSubmission.countDocuments(query);
    const submissions = await TaskSubmission.find(query)
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ submissions, total, page, limit, totalPages: Math.ceil(total / limit) || 1, task });
  } catch (error) {
    console.error('List submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions: ' + error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks/submissions/:submissionId/grade
// @desc    Instructor grades a student's submission (score + feedback, locked once graded)
// @access  Private — instructor (owner) or admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/submissions/:submissionId/grade', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const submission = await TaskSubmission.findById(req.params.submissionId)
      .populate({ path: 'task', populate: { path: 'course', select: 'title instructorId' } })
      .populate('student', 'name email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (!canManageCourse(submission.task?.course, req.user)) {
      return res.status(403).json({ message: 'You do not have permission to grade this submission.' });
    }

    const { score, feedback } = req.body;

    if (score === undefined || score === null || isNaN(Number(score))) {
      return res.status(400).json({ message: 'A numeric score is required for grading.' });
    }

    const maxPoints = submission.task?.maxPoints || 100;
    const numericScore = Number(score);

    if (numericScore < 0 || numericScore > maxPoints) {
      return res.status(400).json({
        message: `Score must be between 0 and ${maxPoints} (the task's maximum points).`,
      });
    }

    const before = {
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
    };

    submission.status = 'graded';
    submission.score = numericScore;
    submission.feedback = feedback ? feedback.trim() : '';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;

    await submission.save();

    await logAuditEvent({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'TASK_GRADED',
      targetType: 'TaskSubmission',
      targetId: submission._id,
      before,
      after: {
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
        studentEmail: submission.student?.email,
        taskTitle: submission.task?.title,
        maxPoints,
      },
      req,
    });

    res.json({
      message: `Submission graded: ${numericScore}/${maxPoints} points awarded.`,
      submission,
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Error grading submission: ' + error.message });
  }
});

export default router;

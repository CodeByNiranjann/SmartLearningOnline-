import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import PracticalExercise from '../models/PracticalExercise.js';
import ExerciseSubmission from '../models/ExerciseSubmission.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';
import {
  EXERCISE_UPLOAD_DIR,
  EXERCISE_UPLOAD_LIMITS,
  validateExerciseFile,
  sanitizeExerciseFilename,
  generateExerciseStorageKey,
} from '../config/exerciseUploadConfig.js';

const router = express.Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: EXERCISE_UPLOAD_LIMITS.maxFileSize,
    files: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. EXERCISE DISCOVERY & RETRIEVAL ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/exercises
// @desc    List practical exercises with filters (course, module, lesson, difficulty, type)
// @access  Public / Optional Auth
router.get('/', optionalProtect, async (req, res) => {
  try {
    const {
      courseId,
      moduleId,
      lessonId,
      difficulty,
      exerciseType,
      status,
      search,
    } = req.query;

    const filter = {};

    // Manager visibility: Draft and Published for their own exercises; Learner visibility: only Published
    const isManager = req.user?.role === 'admin' || req.user?.role === 'instructor';
    if (isManager) {
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (req.user?.role === 'instructor') {
        filter.createdBy = req.user._id;
      }
    } else {
      filter.status = 'Published';
    }

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      filter.moduleId = moduleId;
    }
    if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
      filter.lessonId = lessonId;
    }
    if (difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (exerciseType && ['Text Answer', 'File Upload', 'Coding Exercise', 'Project Task'].includes(exerciseType)) {
      filter.exerciseType = exerciseType;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const exercises = await PracticalExercise.find(filter)
      .populate('courseId', 'title thumbnail category difficulty')
      .populate('moduleId', 'title order')
      .populate('lessonId', 'title order duration')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    // If student is authenticated, attach their current submission status
    let userSubmissionsMap = {};
    if (req.user) {
      const exerciseIds = exercises.map((e) => e._id);
      const submissions = await ExerciseSubmission.find({
        exerciseId: { $in: exerciseIds },
        learnerId: req.user._id,
      });

      submissions.forEach((sub) => {
        userSubmissionsMap[sub.exerciseId.toString()] = {
          _id: sub._id,
          submissionStatus: sub.submissionStatus,
          attemptNumber: sub.attemptNumber,
          marksAwarded: sub.marksAwarded,
          reviewerFeedback: sub.reviewerFeedback,
          submittedAt: sub.submittedAt,
          reviewedAt: sub.reviewedAt,
        };
      });
    }

    const exercisesWithStatus = exercises.map((ex) => {
      const exObj = ex.toObject();
      exObj.mySubmission = userSubmissionsMap[ex._id.toString()] || null;
      return exObj;
    });

    res.json({
      success: true,
      count: exercisesWithStatus.length,
      exercises: exercisesWithStatus,
    });
  } catch (error) {
    console.error('List exercises error:', error);
    res.status(500).json({ message: 'Error fetching practical exercises', error: error.message });
  }
});

// @route   GET /api/exercises/:exerciseId
// @desc    Retrieve detailed exercise with instructions, reference materials & learner submission
// @access  Public / Optional Auth
router.get('/:exerciseId', optionalProtect, async (req, res) => {
  try {
    const { exerciseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID format' });
    }

    const exercise = await PracticalExercise.findById(exerciseId)
      .populate('courseId', 'title thumbnail category difficulty duration')
      .populate('moduleId', 'title order')
      .populate('lessonId', 'title order duration content')
      .populate('createdBy', 'name email avatar');

    if (!exercise) {
      return res.status(404).json({ message: 'Practical exercise not found.' });
    }

    // Check publication authorization: Draft exercises are only viewable by course manager/admin
    if (exercise.status === 'Draft') {
      const isManager = req.user && canManageCourse(exercise.courseId, req.user);
      if (!isManager) {
        return res.status(403).json({ message: 'This practical exercise is currently in draft mode.' });
      }
    }

    // Attach student submission with full attempt history if authenticated
    let mySubmission = null;
    let enrollment = null;
    if (req.user) {
      mySubmission = await ExerciseSubmission.findOne({
        exerciseId: exercise._id,
        learnerId: req.user._id,
      }).populate('reviewedBy', 'name email avatar');

      enrollment = await Enrollment.findOne({
        userId: req.user._id,
        courseId: exercise.courseId._id || exercise.courseId,
        status: { $in: ['active', 'completed'] },
      });
    }

    res.json({
      success: true,
      exercise,
      mySubmission,
      isEnrolled: Boolean(enrollment),
    });
  } catch (error) {
    console.error('Get exercise details error:', error);
    res.status(500).json({ message: 'Error retrieving exercise details', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. INSTRUCTOR & ADMIN EXERCISE MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/courses/:courseId/exercises
// @desc    Create a new practical exercise for a course (validating course ownership & relationships)
// @access  Private — Instructor (course owner) or Admin
const createExerciseHandler = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Verify course ownership
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You are not authorized to create exercises for this course.' });
    }

    const {
      title,
      description,
      learningObjectives,
      instructions,
      exerciseType,
      difficulty,
      estimatedMinutes,
      maximumMarks,
      passingMarks,
      dueDate,
      moduleId,
      lessonId,
      referenceMaterials,
      status,
    } = req.body;

    if (!title || !description || !instructions) {
      return res.status(400).json({ message: 'Exercise title, description, and instructions are required.' });
    }

    // Validate Module relationship
    let validModuleId = null;
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      const mod = await Module.findById(moduleId);
      if (!mod) {
        return res.status(404).json({ message: 'Selected module not found.' });
      }
      if (mod.courseId.toString() !== courseId.toString()) {
        return res.status(400).json({ message: 'The selected module does not belong to this course.' });
      }
      validModuleId = mod._id;
    }

    // Validate Lesson relationship
    let validLessonId = null;
    if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: 'Selected lesson not found.' });
      }
      if (lesson.courseId.toString() !== courseId.toString()) {
        return res.status(400).json({ message: 'The selected lesson does not belong to this course.' });
      }
      if (validModuleId && lesson.moduleId.toString() !== validModuleId.toString()) {
        return res.status(400).json({ message: 'The selected lesson does not belong to the selected module.' });
      }
      validLessonId = lesson._id;
    }

    const exercise = await PracticalExercise.create({
      title: title.trim(),
      description: description.trim(),
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
      instructions,
      exerciseType: exerciseType || 'Coding Exercise',
      difficulty: difficulty || 'Beginner',
      estimatedMinutes: Number(estimatedMinutes) || 30,
      maximumMarks: Number(maximumMarks) || 100,
      passingMarks: Number(passingMarks) || 70,
      dueDate: dueDate ? new Date(dueDate) : null,
      courseId: course._id,
      moduleId: validModuleId,
      lessonId: validLessonId,
      createdBy: req.user._id,
      referenceMaterials: Array.isArray(referenceMaterials) ? referenceMaterials : [],
      status: status || 'Published',
    });

    res.status(201).json({
      success: true,
      message: 'Practical exercise successfully created!',
      exercise,
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ message: 'Failed to create practical exercise', error: error.message });
  }
};

router.post('/courses/:courseId/exercises', protect, requireRole('instructor', 'admin'), createExerciseHandler);
router.post('/course/:courseId', protect, requireRole('instructor', 'admin'), createExerciseHandler);

// @route   PUT /api/exercises/:exerciseId
// @desc    Update practical exercise
// @access  Private — Instructor (course owner) or Admin
router.put('/:exerciseId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { exerciseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID' });
    }

    const exercise = await PracticalExercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Practical exercise not found.' });
    }

    const course = await Course.findById(exercise.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You are not authorized to modify exercises for this course.' });
    }

    const {
      title,
      description,
      learningObjectives,
      instructions,
      exerciseType,
      difficulty,
      estimatedMinutes,
      maximumMarks,
      passingMarks,
      dueDate,
      moduleId,
      lessonId,
      referenceMaterials,
      status,
    } = req.body;

    // Validate Module if modified
    if (moduleId !== undefined) {
      if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
        const mod = await Module.findById(moduleId);
        if (!mod || mod.courseId.toString() !== exercise.courseId.toString()) {
          return res.status(400).json({ message: 'The selected module does not belong to this course.' });
        }
        exercise.moduleId = mod._id;
      } else {
        exercise.moduleId = null;
      }
    }

    // Validate Lesson if modified
    if (lessonId !== undefined) {
      if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson || lesson.courseId.toString() !== exercise.courseId.toString()) {
          return res.status(400).json({ message: 'The selected lesson does not belong to this course.' });
        }
        exercise.lessonId = lesson._id;
      } else {
        exercise.lessonId = null;
      }
    }

    if (title !== undefined) exercise.title = title.trim();
    if (description !== undefined) exercise.description = description.trim();
    if (learningObjectives !== undefined) exercise.learningObjectives = learningObjectives;
    if (instructions !== undefined) exercise.instructions = instructions;
    if (exerciseType !== undefined) exercise.exerciseType = exerciseType;
    if (difficulty !== undefined) exercise.difficulty = difficulty;
    if (estimatedMinutes !== undefined) exercise.estimatedMinutes = Number(estimatedMinutes);
    if (maximumMarks !== undefined) exercise.maximumMarks = Number(maximumMarks);
    if (passingMarks !== undefined) exercise.passingMarks = Number(passingMarks);
    if (dueDate !== undefined) exercise.dueDate = dueDate ? new Date(dueDate) : null;
    if (referenceMaterials !== undefined) exercise.referenceMaterials = referenceMaterials;
    if (status !== undefined) exercise.status = status;

    await exercise.save();

    res.json({
      success: true,
      message: 'Practical exercise successfully updated.',
      exercise,
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ message: 'Failed to update exercise', error: error.message });
  }
});

// @route   DELETE /api/exercises/:exerciseId
// @desc    Delete practical exercise and associated submissions
// @access  Private — Instructor (course owner) or Admin
router.delete('/:exerciseId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { exerciseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID' });
    }

    const exercise = await PracticalExercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Practical exercise not found.' });
    }

    const course = await Course.findById(exercise.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You are not authorized to delete exercises for this course.' });
    }

    // Delete submission files from storage
    const submissions = await ExerciseSubmission.find({ exerciseId });
    for (const sub of submissions) {
      if (sub.fileReference?.storageKey) {
        const filePath = path.join(EXERCISE_UPLOAD_DIR, sub.fileReference.storageKey);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (_) {}
        }
      }
    }

    await ExerciseSubmission.deleteMany({ exerciseId });
    await PracticalExercise.findByIdAndDelete(exerciseId);

    res.json({
      success: true,
      message: 'Practical exercise and associated submissions successfully deleted.',
    });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ message: 'Failed to delete exercise', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. LEARNER SUBMISSIONS & RESUBMISSION HISTORY
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/exercises/:exerciseId/submissions
// @desc    Submit or update practical exercise answer / file (preserves attempt history)
// @access  Private — Authenticated Enrolled Learner
router.post(
  '/:exerciseId/submissions',
  protect,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'The uploaded file exceeds the 10 MB size limit.' });
        }
        return res.status(400).json({ message: err.message || 'File upload error.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { exerciseId } = req.params;
      const { textAnswer, saveAsDraft } = req.body;

      if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
        return res.status(400).json({ message: 'Invalid exercise ID' });
      }

      const exercise = await PracticalExercise.findById(exerciseId);
      if (!exercise) {
        return res.status(404).json({ message: 'Practical exercise not found.' });
      }

      // 1. Validate Learner Enrollment
      const enrollment = await Enrollment.findOne({
        userId: req.user._id,
        courseId: exercise.courseId,
        status: { $in: ['active', 'completed'] },
      });

      if (!enrollment) {
        return res.status(403).json({
          message: 'You must be enrolled in this course to submit practical exercises.',
        });
      }

      // 2. Validate and Save Uploaded File if provided
      let fileReference = null;
      if (req.file) {
        const validation = validateExerciseFile(req.file.buffer, req.file.originalname, req.file.mimetype);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }

        const sanitized = sanitizeExerciseFilename(req.file.originalname);
        const storageKey = generateExerciseStorageKey(validation.extension);
        const absolutePath = path.join(EXERCISE_UPLOAD_DIR, storageKey);

        // Write safely to disk without executing
        fs.writeFileSync(absolutePath, req.file.buffer, { mode: 0o600 });

        fileReference = {
          originalName: sanitized,
          storageKey,
          mimeType: validation.mimeType,
          size: req.file.size,
          category: validation.category,
          uploadedAt: new Date(),
        };
      }

      // Check required content depending on exercise type
      const isDraft = saveAsDraft === 'true' || saveAsDraft === true;
      const targetStatus = isDraft ? 'In Progress' : 'Submitted';

      if (!isDraft) {
        if (exercise.exerciseType === 'Text Answer') {
          if (!textAnswer || !textAnswer.trim()) {
            return res.status(400).json({ message: 'Please provide your text answer before submitting.' });
          }
        } else if (exercise.exerciseType === 'File Upload') {
          const existingSub = await ExerciseSubmission.findOne({ exerciseId, learnerId: req.user._id });
          if (!fileReference && !existingSub?.fileReference) {
            return res.status(400).json({ message: 'Please upload a file for this exercise.' });
          }
        } else {
          // Coding Exercise or Project Task: Allow file upload, code/text answer, or both
          const existingSub = await ExerciseSubmission.findOne({ exerciseId, learnerId: req.user._id });
          const hasFile = Boolean(fileReference || existingSub?.fileReference);
          const hasCodeOrText = Boolean(textAnswer && textAnswer.trim());
          if (!hasFile && !hasCodeOrText) {
            return res.status(400).json({ message: 'Please provide your solution (code or file upload) before submitting.' });
          }
        }
      }

      // 3. Upsert with History Preservation
      let submission = await ExerciseSubmission.findOne({
        exerciseId: exercise._id,
        learnerId: req.user._id,
      });

      if (submission) {
        // If re-submitting an already submitted or evaluated attempt, push to history!
        if (submission.submissionStatus !== 'In Progress' && !isDraft) {
          submission.history.push({
            attemptNumber: submission.attemptNumber,
            textAnswer: submission.textAnswer,
            fileReference: submission.fileReference,
            submissionStatus: submission.submissionStatus,
            submittedAt: submission.submittedAt,
            marksAwarded: submission.marksAwarded,
            reviewerFeedback: submission.reviewerFeedback,
            reviewedBy: submission.reviewedBy,
            reviewedAt: submission.reviewedAt,
          });
          submission.attemptNumber += 1;
        }

        if (textAnswer !== undefined) submission.textAnswer = textAnswer;
        if (fileReference) submission.fileReference = fileReference;
        submission.submissionStatus = targetStatus;
        submission.submittedAt = new Date();

        // Reset review state on new submission attempt
        if (!isDraft) {
          submission.marksAwarded = null;
          submission.reviewerFeedback = null;
          submission.reviewedBy = null;
          submission.reviewedAt = null;
        }

        await submission.save();

        return res.json({
          success: true,
          message: isDraft
            ? 'Exercise draft saved as In Progress.'
            : 'Practical exercise submitted successfully! An instructor will review your work.',
          submission,
        });
      }

      // New submission
      submission = await ExerciseSubmission.create({
        exerciseId: exercise._id,
        learnerId: req.user._id,
        enrollmentId: enrollment._id,
        courseId: exercise.courseId,
        textAnswer: textAnswer || null,
        fileReference: fileReference || null,
        submissionStatus: targetStatus,
        attemptNumber: 1,
        submittedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: isDraft
          ? 'Exercise progress saved.'
          : 'Practical exercise submitted successfully! An instructor will review your work.',
        submission,
      });
    } catch (error) {
      console.error('Submit exercise error:', error);
      res.status(500).json({ message: 'Failed to submit exercise', error: error.message });
    }
  }
);

// @route   GET /api/exercises/:exerciseId/submissions/me
// @desc    Retrieve the current learner's submission with full attempt history
// @access  Private — Authenticated Learner
router.get('/:exerciseId/submissions/me', protect, async (req, res) => {
  try {
    const { exerciseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID' });
    }

    const submission = await ExerciseSubmission.findOne({
      exerciseId,
      learnerId: req.user._id,
    })
      .populate('reviewedBy', 'name email avatar')
      .populate('history.reviewedBy', 'name');

    if (!submission) {
      return res.json({ success: true, submission: null });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({ message: 'Error retrieving submission', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. INSTRUCTOR REVIEW & GRADING ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/exercises/:exerciseId/submissions
// @desc    List all student submissions for an exercise (for authorized instructors/admins)
// @access  Private — Instructor (course owner) or Admin
router.get('/:exerciseId/submissions', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const { exerciseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID' });
    }

    const exercise = await PracticalExercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Practical exercise not found.' });
    }

    const course = await Course.findById(exercise.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You are not authorized to view submissions for this exercise.' });
    }

    const submissions = await ExerciseSubmission.find({ exerciseId })
      .populate('learnerId', 'name email avatar')
      .populate('reviewedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      exercise: {
        _id: exercise._id,
        title: exercise.title,
        maximumMarks: exercise.maximumMarks,
        passingMarks: exercise.passingMarks,
        exerciseType: exercise.exerciseType,
      },
      submissions,
    });
  } catch (error) {
    console.error('List exercise submissions error:', error);
    res.status(500).json({ message: 'Error retrieving submissions', error: error.message });
  }
});

// @route   PATCH /api/submissions/:submissionId/review
// @route   PUT /api/exercises/:exerciseId/submissions/:submissionId/review
// @desc    Review submission and assign marks / feedback
// @access  Private — Instructor or Admin
const reviewSubmissionHandler = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksAwarded, reviewerFeedback, submissionStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    const submission = await ExerciseSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const exercise = await PracticalExercise.findById(submission.exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Associated exercise not found.' });
    }

    const course = await Course.findById(exercise.courseId);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'You are not authorized to review this submission.' });
    }

    // Validate marks
    if (marksAwarded !== undefined && marksAwarded !== null) {
      const marks = Number(marksAwarded);
      if (isNaN(marks) || marks < 0 || marks > exercise.maximumMarks) {
        return res.status(400).json({
          message: `Marks awarded must be a number between 0 and ${exercise.maximumMarks}.`,
        });
      }
      submission.marksAwarded = marks;
    }

    if (reviewerFeedback !== undefined) {
      submission.reviewerFeedback = reviewerFeedback;
    }

    if (submissionStatus) {
      if (!['Under Review', 'Accepted', 'Needs Revision'].includes(submissionStatus)) {
        return res.status(400).json({ message: 'Invalid review status. Choose Accepted, Needs Revision, or Under Review.' });
      }
      submission.submissionStatus = submissionStatus;
    } else {
      submission.submissionStatus =
        submission.marksAwarded !== null && submission.marksAwarded >= exercise.passingMarks
          ? 'Accepted'
          : 'Needs Revision';
    }

    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();

    await submission.save();

    res.json({
      success: true,
      message: 'Exercise submission successfully reviewed!',
      submission,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Failed to review submission', error: error.message });
  }
};

router.patch('/submissions/:submissionId/review', protect, requireRole('instructor', 'admin'), reviewSubmissionHandler);
router.put('/:exerciseId/submissions/:submissionId/review', protect, requireRole('instructor', 'admin'), reviewSubmissionHandler);

// @route   GET /api/submissions/:submissionId/file
// @desc    Securely download or preview student's submitted file
// @access  Private — Learner (owner) or Instructor/Admin
router.get('/submissions/:submissionId/file', protect, async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }

    const submission = await ExerciseSubmission.findById(submissionId);
    if (!submission || !submission.fileReference?.storageKey) {
      return res.status(404).json({ message: 'Submitted file not found.' });
    }

    // Authorization check: learner or authorized instructor/admin
    const isOwner = submission.learnerId.toString() === req.user._id.toString();
    let isManager = req.user.role === 'admin';
    if (!isManager && !isOwner) {
      const exercise = await PracticalExercise.findById(submission.exerciseId);
      const course = exercise ? await Course.findById(exercise.courseId) : null;
      isManager = course && canManageCourse(course, req.user);
    }

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'You are not authorized to view this file.' });
    }

    const filePath = path.join(EXERCISE_UPLOAD_DIR, submission.fileReference.storageKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File is missing from storage.' });
    }

    res.setHeader('Content-Type', submission.fileReference.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(submission.fileReference.originalName)}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download submission file error:', error);
    res.status(500).json({ message: 'Error accessing file', error: error.message });
  }
});

// @route   GET /api/exercises/:exerciseId/attachment
// @desc    Download experiment starter kit / lab resource file
// @access  Public / Authenticated
router.get('/:exerciseId/attachment', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: 'Invalid exercise ID' });
    }

    const exercise = await PracticalExercise.findById(exerciseId);
    if (!exercise || !exercise.experimentFile?.storageKey) {
      return res.status(404).json({ message: 'No experiment attachment file available.' });
    }

    const filePath = path.join(EXERCISE_UPLOAD_DIR, exercise.experimentFile.storageKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Experiment file is missing from storage.' });
    }

    res.setHeader('Content-Type', exercise.experimentFile.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(exercise.experimentFile.originalName)}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download experiment attachment error:', error);
    res.status(500).json({ message: 'Error accessing experiment file', error: error.message });
  }
});

export default router;

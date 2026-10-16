import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Lesson from '../models/Lesson.js';
import Module from '../models/Module.js';
import Course from '../models/Course.js';
import Resource from '../models/Resource.js';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { requireRole, canManageCourse } from '../middleware/roleMiddleware.js';
import {
  UPLOAD_DIR,
  UPLOAD_LIMITS,
  validateUploadedBuffer,
  sanitizeFilename,
  generateStorageKey,
} from '../config/uploadConfig.js';

const router = express.Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_LIMITS.maxFileSize,
    files: UPLOAD_LIMITS.maxFilesPerRequest,
  },
});

/**
 * Helper to verify user has permission to manage resources for a lesson.
 * Returns { allowed: boolean, lesson, module, course, status: number, message: string }
 */
async function verifyLessonManagementPermission(lessonId, user) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return { allowed: false, status: 404, message: 'This lesson could not be found.' };
  }

  const parentModule = await Module.findById(lesson.moduleId);
  if (!parentModule) {
    return { allowed: false, status: 404, message: 'Parent module for this lesson could not be found.' };
  }

  const parentCourse = await Course.findById(parentModule.courseId);
  if (!parentCourse) {
    return { allowed: false, status: 404, message: 'Parent course for this lesson could not be found.' };
  }

  if (!canManageCourse(parentCourse, user)) {
    return {
      allowed: false,
      status: 403,
      message: 'You do not have permission to upload resources to this lesson.',
    };
  }

  return { allowed: true, lesson, module: parentModule, course: parentCourse };
}

/**
 * Helper to check if a user can download/view resources of a course.
 */
async function canAccessResource(resource, user) {
  if (!resource) return false;
  const lesson = await Lesson.findById(resource.lessonId);
  if (!lesson) return false;
  const course = await Course.findById(lesson.courseId);
  if (!course) return false;

  // Admin or course owner
  if (user && canManageCourse(course, user)) return true;

  // Published course accessible to authenticated learners or guests
  if (course.status === 'published') return true;

  // Check enrollment
  if (user) {
    const isEnrolled = await Enrollment.findOne({
      userId: user._id,
      courseId: course._id,
      status: 'active',
    });
    if (isEnrolled) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON RESOURCE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @route   POST /api/lessons/:lessonId/resources
// @desc    Upload one or more files as resources to a lesson (or add external resource)
// @access  Private — Course Instructor or Admin
router.post(
  '/lessons/:lessonId/resources',
  protect,
  requireRole('instructor', 'admin'),
  (req, res, next) => {
    // Multer upload wrapper with custom error messages
    upload.array('files', UPLOAD_LIMITS.maxFilesPerRequest)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'The selected file exceeds the 10 MB size limit.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'You can upload a maximum of 5 files per request.' });
        }
        return res.status(400).json({ message: err.message || 'File upload validation failed.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      const perm = await verifyLessonManagementPermission(lessonId, req.user);
      if (!perm.allowed) {
        return res.status(perm.status).json({ message: perm.message });
      }

      // 1. If files were uploaded via multipart/form-data
      if (req.files && req.files.length > 0) {
        if (req.files.length > UPLOAD_LIMITS.maxFilesPerRequest) {
          return res.status(400).json({ message: 'You can upload a maximum of 5 files per request.' });
        }

        const createdResources = [];
        const savedFilePaths = [];

        try {
          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const validation = validateUploadedBuffer(file.buffer, file.originalname, file.mimetype);

            if (!validation.valid) {
              // Clean up any files saved so far in this request
              savedFilePaths.forEach((fp) => {
                if (fs.existsSync(fp)) fs.unlinkSync(fp);
              });
              return res.status(400).json({ message: validation.error });
            }

            const sanitizedOriginal = sanitizeFilename(file.originalname);
            const storageFilename = generateStorageKey(validation.extension);
            const absoluteStoragePath = path.join(UPLOAD_DIR, storageFilename);

            // Write verified file to disk outside public web root
            fs.writeFileSync(absoluteStoragePath, file.buffer, { mode: 0o600 });
            savedFilePaths.push(absoluteStoragePath);

            // Determine display title
            const customTitle = Array.isArray(req.body.titles)
              ? req.body.titles[i]
              : req.body.title || path.parse(sanitizedOriginal).name;

            const customDescription = Array.isArray(req.body.descriptions)
              ? req.body.descriptions[i]
              : req.body.description || '';

            const resource = await Resource.create({
              lessonId,
              title: customTitle.trim() || sanitizedOriginal,
              description: customDescription.trim(),
              originalFilename: sanitizedOriginal,
              storedFilename: storageFilename,
              fileExtension: validation.extension,
              mimeType: validation.mimeType,
              fileSizeBytes: file.buffer.length,
              type: validation.category,
              storagePath: absoluteStoragePath,
              url: `/api/resources/${storageFilename}/download`, // placeholder or internal route
              uploadedBy: req.user._id,
            });

            // Update permanent url pointing to resourceId
            resource.url = `/api/resources/${resource._id}/download`;
            await resource.save();

            createdResources.push(resource);
          }

          return res.status(201).json({
            message: 'The file was uploaded successfully.',
            count: createdResources.length,
            resources: createdResources,
          });
        } catch (storageError) {
          // Clean up on failure
          savedFilePaths.forEach((fp) => {
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
          });
          console.error('File storage error:', storageError);
          return res.status(500).json({
            message: 'The file upload failed. Check your connection and try again.',
          });
        }
      }

      // 2. If no files, check for external URL resource creation
      const { title, url, type, description } = req.body;
      if (!title || !url) {
        return res.status(400).json({ message: 'Please select a file to upload.' });
      }

      const resource = await Resource.create({
        lessonId,
        title: title.trim(),
        description: description?.trim() || '',
        type: type || 'Website',
        url: url.trim(),
        uploadedBy: req.user._id,
      });

      res.status(201).json({
        message: 'Resource added successfully.',
        resources: [resource],
      });
    } catch (error) {
      console.error('Create resource error:', error);
      res.status(500).json({ message: 'The file upload failed. Check your connection and try again.' });
    }
  }
);

// @route   GET /api/lessons/:lessonId/resources
// @desc    List all resources associated with a lesson
// @access  Public / Optional Auth
router.get('/lessons/:lessonId/resources', optionalProtect, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'This lesson could not be found.' });
    }

    const resources = await Resource.find({ lessonId }).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    console.error('Fetch lesson resources error:', error);
    res.status(500).json({ message: 'Error retrieving lesson resources.' });
  }
});

// @route   GET /api/courses/:courseId/resources
// @desc    List all learning resources associated with all lessons in a course (SLP-4)
// @access  Public / Optional Auth
router.get('/courses/:courseId/resources', optionalProtect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type, search } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const modules = await Module.find({ courseId }).sort({ order: 1 });
    const moduleMap = {};
    const moduleIds = modules.map((m) => {
      moduleMap[m._id.toString()] = m;
      return m._id;
    });

    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 });
    const lessonMap = {};
    const lessonIds = lessons.map((l) => {
      lessonMap[l._id.toString()] = {
        ...l.toObject(),
        module: moduleMap[l.moduleId?.toString()],
      };
      return l._id;
    });

    const resourceQuery = { lessonId: { $in: lessonIds } };
    if (type && type !== 'All') {
      resourceQuery.type = type;
    }
    if (search) {
      resourceQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await Resource.find(resourceQuery).sort({ createdAt: -1 });

    const enrichedResources = resources.map((r) => {
      const les = lessonMap[r.lessonId.toString()];
      return {
        ...r.toObject(),
        lessonTitle: les?.title || 'Course Lesson',
        lessonOrder: les?.order || 1,
        moduleTitle: les?.module?.title || 'Course Module',
        courseTitle: course.title,
        courseId: course._id,
      };
    });

    res.json(enrichedResources);
  } catch (error) {
    console.error('Fetch course resources error:', error);
    res.status(500).json({ message: 'Error retrieving course resources.' });
  }
});

// @route   GET /api/resources
// @desc    Global Learning Resources Hub — browse and search all resources in one place (SLP-4)
// @access  Public / Optional Auth
router.get('/resources', optionalProtect, async (req, res) => {
  try {
    const { search, type, courseId } = req.query;

    let targetLessonIds = null;
    if (courseId) {
      const modules = await Module.find({ courseId });
      const lessons = await Lesson.find({ moduleId: { $in: modules.map((m) => m._id) } });
      targetLessonIds = lessons.map((l) => l._id);
    }

    // Get all published courses
    const courses = await Course.find({ status: { $ne: 'draft' } });
    const courseMap = {};
    courses.forEach((c) => {
      courseMap[c._id.toString()] = c;
    });

    const allModules = await Module.find({ courseId: { $in: courses.map((c) => c._id) } });
    const moduleMap = {};
    allModules.forEach((m) => {
      moduleMap[m._id.toString()] = m;
    });

    const allLessons = await Lesson.find({ moduleId: { $in: allModules.map((m) => m._id) } });
    const lessonMap = {};
    allLessons.forEach((l) => {
      lessonMap[l._id.toString()] = {
        ...l.toObject(),
        module: moduleMap[l.moduleId?.toString()],
        course: courseMap[l.courseId?.toString()],
      };
    });

    const query = {};
    if (targetLessonIds) {
      query.lessonId = { $in: targetLessonIds };
    } else {
      query.lessonId = { $in: allLessons.map((l) => l._id) };
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });

    const enriched = resources.map((r) => {
      const les = lessonMap[r.lessonId.toString()];
      return {
        ...r.toObject(),
        lessonTitle: les?.title || 'Lesson Resource',
        lessonOrder: les?.order || 1,
        moduleTitle: les?.module?.title || 'Course Module',
        courseTitle: les?.course?.title || 'Course',
        courseCategory: les?.course?.category || 'General',
        courseId: les?.course?._id || null,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Fetch all resources error:', error);
    res.status(500).json({ message: 'Error retrieving learning resources.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE RESOURCE CRUD & DOWNLOAD ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/resources/:resourceId
// @desc    Retrieve resource metadata
// @access  Public / Optional Auth
router.get('/resources/:resourceId', optionalProtect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resource metadata.' });
  }
});

// @route   GET /api/resources/:resourceId/download
// @desc    Download an authorized resource file
// @access  Public / Protected based on course enrollment/status
router.get('/resources/:resourceId/download', optionalProtect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    // If external URL resource, redirect to it
    if (!resource.storagePath || !resource.storedFilename) {
      return res.redirect(resource.url);
    }

    // Access check
    const allowed = await canAccessResource(resource, req.user);
    if (!allowed) {
      return res.status(403).json({
        message: 'You do not have permission to download this resource. Please enroll in the course.',
      });
    }

    const filePath = path.resolve(UPLOAD_DIR, resource.storedFilename);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ message: 'Access denied: invalid storage path.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'The requested resource file is no longer on storage.' });
    }

    const downloadFilename = sanitizeFilename(resource.originalFilename || resource.title + (resource.fileExtension || ''));

    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Download resource error:', error);
    res.status(500).json({ message: 'Failed to download resource file.' });
  }
});

// @route   GET /api/resources/:resourceId/preview
// @desc    Preview supported resource types inline in browser (PDF, Images, Text)
// @access  Public / Protected based on course enrollment/status
router.get('/resources/:resourceId/preview', optionalProtect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (!resource.storagePath || !resource.storedFilename) {
      return res.redirect(resource.url);
    }

    const allowed = await canAccessResource(resource, req.user);
    if (!allowed) {
      return res.status(403).json({
        message: 'You do not have permission to view this resource. Please enroll in the course.',
      });
    }

    const filePath = path.resolve(UPLOAD_DIR, resource.storedFilename);
    if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'The requested file is not available on storage.' });
    }

    const previewFilename = sanitizeFilename(resource.originalFilename || resource.title + (resource.fileExtension || ''));

    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${previewFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Preview resource error:', error);
    res.status(500).json({ message: 'Failed to preview resource file.' });
  }
});

// @route   PATCH /api/resources/:resourceId
// @desc    Update resource metadata such as title or description
// @access  Private — Course Instructor or Admin
router.patch('/resources/:resourceId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    const perm = await verifyLessonManagementPermission(resource.lessonId, req.user);
    if (!perm.allowed) {
      return res.status(perm.status).json({ message: perm.message });
    }

    const { title, description, type } = req.body;

    if (title !== undefined) resource.title = title.trim();
    if (description !== undefined) resource.description = description.trim();
    if (type !== undefined && resource.type !== type) {
      resource.type = type;
    }

    await resource.save();

    res.json({
      message: 'Resource metadata updated successfully.',
      resource,
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Error updating resource metadata.' });
  }
});

// @route   PUT /api/resources/:resourceId/file
// @desc    Replace an existing resource file with a newly uploaded file
// @access  Private — Course Instructor or Admin
router.put(
  '/resources/:resourceId/file',
  protect,
  requireRole('instructor', 'admin'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'The selected file exceeds the 10 MB size limit.' });
        }
        return res.status(400).json({ message: err.message || 'File upload validation failed.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const resource = await Resource.findById(req.params.resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found.' });
      }

      const perm = await verifyLessonManagementPermission(resource.lessonId, req.user);
      if (!perm.allowed) {
        return res.status(perm.status).json({ message: perm.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Please select a file to upload.' });
      }

      const validation = validateUploadedBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const oldStoredFilename = resource.storedFilename;
      const sanitizedOriginal = sanitizeFilename(req.file.originalname);
      const newStorageFilename = generateStorageKey(validation.extension);
      const newAbsoluteStoragePath = path.join(UPLOAD_DIR, newStorageFilename);

      // Write new file
      fs.writeFileSync(newAbsoluteStoragePath, req.file.buffer, { mode: 0o600 });

      // Update resource metadata
      resource.originalFilename = sanitizedOriginal;
      resource.storedFilename = newStorageFilename;
      resource.fileExtension = validation.extension;
      resource.mimeType = validation.mimeType;
      resource.fileSizeBytes = req.file.buffer.length;
      resource.type = validation.category;
      resource.storagePath = newAbsoluteStoragePath;
      resource.url = `/api/resources/${resource._id}/download`;
      await resource.save();

      // Safely delete old file if it existed on disk
      if (oldStoredFilename) {
        const oldPath = path.join(UPLOAD_DIR, oldStoredFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.warn('Could not remove superseded resource file:', err);
          });
        }
      }

      res.json({
        message: 'The file was uploaded successfully.',
        resource,
      });
    } catch (error) {
      console.error('Replace resource file error:', error);
      res.status(500).json({ message: 'The file upload failed. Check your connection and try again.' });
    }
  }
);

// @route   DELETE /api/resources/:resourceId
// @desc    Delete a resource and remove stored file safely
// @access  Private — Course Instructor or Admin
router.delete('/resources/:resourceId', protect, requireRole('instructor', 'admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    const perm = await verifyLessonManagementPermission(resource.lessonId, req.user);
    if (!perm.allowed) {
      return res.status(perm.status).json({ message: perm.message });
    }

    const storedFile = resource.storedFilename;

    // Delete record from MongoDB
    await Resource.findByIdAndDelete(resource._id);

    // Delete physical file from disk safely
    if (storedFile) {
      const filePath = path.join(UPLOAD_DIR, storedFile);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('Could not delete physical file from storage:', unlinkErr);
        }
      }
    }

    res.json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'The resource could not be deleted. Please try again.' });
  }
});

export default router;

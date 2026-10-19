import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dedicated secure storage directory for practical exercise submissions
export const EXERCISE_UPLOAD_DIR = path.resolve(__dirname, '../uploads/exercises');

// Ensure upload directory exists
if (!fs.existsSync(EXERCISE_UPLOAD_DIR)) {
  fs.mkdirSync(EXERCISE_UPLOAD_DIR, { recursive: true });
}

// Configurable upload limits for exercise submissions
export const EXERCISE_UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB limit
  allowedExtensions: [
    '.pdf',
    '.txt',
    '.zip',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.html',
    '.css',
    '.json',
    '.md',
  ],
};

// Map of extensions to MIME types and signature checks
export const EXERCISE_ALLOWED_TYPES = {
  '.pdf': {
    category: 'Document',
    mime: 'application/pdf',
    magicCheck: (buf) => buf.length >= 4 && buf.slice(0, 4).toString('ascii') === '%PDF',
  },
  '.zip': {
    category: 'Archive',
    mime: 'application/zip',
    magicCheck: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07),
  },
  '.txt': {
    category: 'Text',
    mime: 'text/plain',
    magicCheck: (buf) => {
      const sample = buf.slice(0, Math.min(buf.length, 1024));
      return !sample.includes(0x00);
    },
  },
  '.md': {
    category: 'Markdown',
    mime: 'text/markdown',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.json': {
    category: 'JSON',
    mime: 'application/json',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.js': {
    category: 'JavaScript',
    mime: 'text/javascript',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.jsx': {
    category: 'React JSX',
    mime: 'text/javascript',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.ts': {
    category: 'TypeScript',
    mime: 'application/typescript',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.tsx': {
    category: 'TypeScript JSX',
    mime: 'application/typescript',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.py': {
    category: 'Python',
    mime: 'text/x-python',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.java': {
    category: 'Java',
    mime: 'text/x-java-source',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.cpp': {
    category: 'C++',
    mime: 'text/x-c',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.c': {
    category: 'C',
    mime: 'text/x-c',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.html': {
    category: 'HTML',
    mime: 'text/html',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
  '.css': {
    category: 'CSS',
    mime: 'text/css',
    magicCheck: (buf) => !buf.slice(0, Math.min(buf.length, 1024)).includes(0x00),
  },
};

/**
 * Sanitize filename to prevent directory traversal and remove dangerous characters
 */
export function sanitizeExerciseFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'exercise_submission';
  const clean = path.basename(filename).replace(/[^\w\.\-\s\(\)\[\]]/gi, '_').trim();
  return clean.slice(0, 150) || 'exercise_submission';
}

/**
 * Generate cryptographically random, collision-free storage key
 */
export function generateExerciseStorageKey(ext) {
  const safeExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  const randomHex = crypto.randomBytes(16).toString('hex');
  return `ex_sub_${Date.now()}_${randomHex}${safeExt}`;
}

/**
 * Validate file buffer against supported extensions, magic bytes, and size
 */
export function validateExerciseFile(buffer, originalFilename, reportedMime) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'The uploaded file is empty (0 bytes).' };
  }

  if (buffer.length > EXERCISE_UPLOAD_LIMITS.maxFileSize) {
    return { valid: false, error: 'The selected file exceeds the 10 MB size limit.' };
  }

  const ext = path.extname(originalFilename || '').toLowerCase();
  const typeConfig = EXERCISE_ALLOWED_TYPES[ext];

  if (!typeConfig) {
    return {
      valid: false,
      error: `Unsupported file format (${ext}). Supported formats: PDF, TXT, ZIP, and source code files (.js, .py, .java, .cpp, .html, .css, etc.).`,
    };
  }

  // Validate magic signature if defined
  if (typeConfig.magicCheck && !typeConfig.magicCheck(buffer)) {
    return {
      valid: false,
      error: `The file contents do not match the expected format for ${ext}. The file appears to be invalid or corrupted.`,
    };
  }

  return {
    valid: true,
    category: typeConfig.category,
    extension: ext,
    mimeType: typeConfig.mime || reportedMime || 'application/octet-stream',
  };
}

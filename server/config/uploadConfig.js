import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory outside public web root
export const UPLOAD_DIR = path.resolve(__dirname, '../uploads/resources');

// Ensure directory exists with secure permissions
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurable upload limits
export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB per file
  maxFilesPerRequest: 5,         // Up to 5 files per request
};

// Allowlist of extensions, their corresponding standard MIME types, and friendly category
export const ALLOWED_FILE_TYPES = {
  '.pdf': {
    category: 'PDF',
    mimes: ['application/pdf'],
    magicCheck: (buffer) => buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF',
  },
  '.doc': {
    category: 'Document',
    mimes: ['application/msword', 'application/x-ole-storage'],
    magicCheck: (buffer) => buffer.length >= 8 && buffer.readUInt32LE(0) === 0xe011cfd0, // OLE compound file
  },
  '.docx': {
    category: 'Document',
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
    magicCheck: (buffer) => buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04, // PK zip header
  },
  '.ppt': {
    category: 'Presentation',
    mimes: ['application/vnd.ms-powerpoint', 'application/x-ole-storage'],
    magicCheck: (buffer) => buffer.length >= 8 && buffer.readUInt32LE(0) === 0xe011cfd0,
  },
  '.pptx': {
    category: 'Presentation',
    mimes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
    magicCheck: (buffer) => buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04,
  },
  '.jpg': {
    category: 'Image',
    mimes: ['image/jpeg'],
    magicCheck: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  '.jpeg': {
    category: 'Image',
    mimes: ['image/jpeg'],
    magicCheck: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  '.png': {
    category: 'Image',
    mimes: ['image/png'],
    magicCheck: (buffer) => buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47,
  },
  '.webp': {
    category: 'Image',
    mimes: ['image/webp'],
    magicCheck: (buffer) => buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP',
  },
  '.txt': {
    category: 'Text',
    mimes: ['text/plain', 'text/plain; charset=utf-8'],
    magicCheck: (buffer) => {
      // Check for lack of binary null bytes in initial chunk
      const sample = buffer.slice(0, Math.min(buffer.length, 1024));
      return !sample.includes(0x00);
    },
  },
};

/**
 * Sanitize user-provided filename:
 * - Strip directory traversal patterns ('..', '/', '\\')
 * - Remove control characters, null bytes, and dangerous symbols
 * - Preserve base name and extension safely
 */
export function sanitizeFilename(originalName) {
  if (!originalName || typeof originalName !== 'string') return 'resource';
  const cleanBase = path.basename(originalName).replace(/[^\w\.\-\s\(\)\[\]]/gi, '_').trim();
  return cleanBase.slice(0, 150) || 'resource';
}

/**
 * Generate cryptographically random, collision-free storage filename
 */
export function generateStorageKey(ext) {
  const safeExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  const randomHex = crypto.randomBytes(16).toString('hex');
  return `res_${Date.now()}_${randomHex}${safeExt}`;
}

/**
 * Validate uploaded file buffer against allowlist & signature
 */
export function validateUploadedBuffer(buffer, originalFilename, reportedMime) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'The uploaded file is empty or corrupted (0 bytes).' };
  }

  if (buffer.length > UPLOAD_LIMITS.maxFileSize) {
    return { valid: false, error: `The selected file exceeds the 10 MB size limit.` };
  }

  const ext = path.extname(originalFilename || '').toLowerCase();
  const config = ALLOWED_FILE_TYPES[ext];

  if (!config) {
    return {
      valid: false,
      error: 'This file format is not supported. Upload a PDF, DOCX, PPTX, JPG, PNG, WEBP, or TXT file.',
    };
  }

  // Validate magic signature if implemented
  if (config.magicCheck && !config.magicCheck(buffer)) {
    return {
      valid: false,
      error: `The file contents do not match the expected format for ${ext}. The file appears to be invalid or corrupted.`,
    };
  }

  return {
    valid: true,
    category: config.category,
    extension: ext,
    mimeType: config.mimes[0] || reportedMime || 'application/octet-stream',
  };
}

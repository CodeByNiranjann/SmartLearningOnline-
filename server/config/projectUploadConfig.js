import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dedicated secure storage directory for project submissions and deliverables
export const PROJECT_UPLOAD_DIR = path.resolve(__dirname, '../uploads/projects');

// Ensure upload directory exists
if (!fs.existsSync(PROJECT_UPLOAD_DIR)) {
  fs.mkdirSync(PROJECT_UPLOAD_DIR, { recursive: true });
}

// Configurable upload limits for project deliverable submissions
export const PROJECT_UPLOAD_LIMITS = {
  maxFileSize: 15 * 1024 * 1024, // 15 MB limit
  allowedExtensions: [
    '.pdf',
    '.zip',
    '.tar.gz',
    '.txt',
    '.md',
    '.json',
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
    '.png',
    '.jpg',
    '.jpeg',
  ],
};

// Map of extensions to MIME types and signature checks
export const PROJECT_ALLOWED_TYPES = {
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
  '.png': {
    category: 'Image',
    mime: 'image/png',
    magicCheck: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47,
  },
  '.jpg': {
    category: 'Image',
    mime: 'image/jpeg',
    magicCheck: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  '.jpeg': {
    category: 'Image',
    mime: 'image/jpeg',
    magicCheck: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
};

/**
 * Sanitize filename to prevent directory traversal and remove dangerous characters
 */
export function sanitizeProjectFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'project_deliverable';
  const clean = path.basename(filename).replace(/[^\w\.\-\s\(\)\[\]]/gi, '_').trim();
  return clean.slice(0, 150) || 'project_deliverable';
}

/**
 * Generate cryptographically random, collision-free storage key
 */
export function generateProjectStorageKey(ext) {
  const safeExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  const randomHex = crypto.randomBytes(16).toString('hex');
  return `proj_deliv_${Date.now()}_${randomHex}${safeExt}`;
}

/**
 * Validate deliverable file buffer against allowed types and limits
 */
export function validateProjectFile(buffer, originalFilename, reportedMime) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'The uploaded deliverable file is empty (0 bytes).' };
  }

  if (buffer.length > PROJECT_UPLOAD_LIMITS.maxFileSize) {
    return { valid: false, error: 'The selected file exceeds the 15 MB size limit.' };
  }

  const ext = path.extname(originalFilename || '').toLowerCase();
  const typeConfig = PROJECT_ALLOWED_TYPES[ext];

  if (!typeConfig) {
    return {
      valid: false,
      error: `Unsupported deliverable file format (${ext}). Supported formats: PDF, ZIP, TXT, MD, Images, and source code files.`,
    };
  }

  if (typeConfig.magicCheck && !typeConfig.magicCheck(buffer)) {
    return {
      valid: false,
      error: `The file contents do not match the expected format for ${ext}. The file appears to be corrupted or invalid.`,
    };
  }

  return {
    valid: true,
    category: typeConfig.category,
    extension: ext,
    mimeType: typeConfig.mime || reportedMime || 'application/octet-stream',
  };
}

import multer from 'multer';
import { AppError } from '../errors/AppError';

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedDocumentMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, 'Only JPEG, PNG, WEBP, and GIF images are allowed'));
      return;
    }

    callback(null, true);
  }
});

export const onboardingDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedDocumentMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, 'Only JPEG, PNG, WEBP, GIF images, and PDF files are allowed'));
      return;
    }

    callback(null, true);
  }
});

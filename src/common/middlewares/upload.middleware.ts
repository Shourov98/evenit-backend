import multer from 'multer';
import { AppError } from '../errors/AppError';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, 'Only JPEG, PNG, WEBP, and GIF images are allowed'));
      return;
    }

    callback(null, true);
  }
});

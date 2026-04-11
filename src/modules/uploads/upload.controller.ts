import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { UploadService } from './upload.service';

export class UploadController {
  private static getFiles(req: Request): Express.Multer.File[] {
    if (Array.isArray(req.files)) {
      return req.files;
    }

    if (!req.files) {
      return [];
    }

    return Object.values(req.files).flat();
  }

  static uploadImages = catchAsync(async (req: Request, res: Response) => {
    const files = UploadController.getFiles(req);
    const folder = typeof req.body?.folder === 'string' ? req.body.folder : 'uploads';

    if (!files.length) {
      throw new AppError(400, 'Images must be sent using image, images, file, or files field');
    }

    const uploaded = await UploadService.uploadImages(files, folder);

    return res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploaded
    });
  });

  static uploadVenueImages = catchAsync(async (req: Request, res: Response) => {
    const files = UploadController.getFiles(req);

    if (!files.length) {
      throw new AppError(400, 'Images must be sent using image, images, file, or files field');
    }

    const uploaded = await UploadService.uploadVenueImages(files);

    return res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploaded
    });
  });

  static uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
    if (!req.user?.userId || !req.user?.role) {
      throw new AppError(401, 'Authentication required: sign in before uploading a profile image');
    }

    const file = req.file;
    if (!file) {
      throw new AppError(400, 'Profile image must be sent using the image field');
    }

    const uploaded = await UploadService.uploadProfileImage(req.user.userId, req.user.role, file);

    return res.status(201).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: uploaded
    });
  });
}

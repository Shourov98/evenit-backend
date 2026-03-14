import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { UploadService } from './upload.service';

export class UploadController {
  static uploadVenueImages = catchAsync(async (req: Request, res: Response) => {
    const files = req.files;

    if (!Array.isArray(files)) {
      throw new AppError(400, 'Images must be sent using the images field');
    }

    const uploaded = await UploadService.uploadVenueImages(files);

    return res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploaded
    });
  });
}

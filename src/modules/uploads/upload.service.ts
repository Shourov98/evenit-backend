import { UploadApiResponse } from 'cloudinary';
import { AppError } from '../../common/errors/AppError';
import { getCloudinary, hasCloudinaryConfig } from '../../config/cloudinary';
import { env } from '../../config/env';

type UploadedImage = {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
};

const uploadBuffer = (buffer: Buffer, folder: string): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });

export class UploadService {
  static async uploadVenueImages(files: Express.Multer.File[]): Promise<UploadedImage[]> {
    if (!hasCloudinaryConfig()) {
      throw new AppError(500, 'Cloudinary is not configured');
    }

    if (!files.length) {
      throw new AppError(400, 'At least one image is required');
    }

    const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/venues`;

    const uploads = await Promise.all(
      files.map(async (file) => {
        const result = await uploadBuffer(file.buffer, folder);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          originalName: file.originalname
        };
      })
    );

    return uploads;
  }
}

import { UploadApiResponse } from 'cloudinary';
import { AppError } from '../../common/errors/AppError';
import { getCloudinary, hasCloudinaryConfig } from '../../config/cloudinary';
import { env } from '../../config/env';
import { UserModel, UserRole } from '../auth/auth.model';

type UploadedImage = {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
};

const roleProfileFolderMap: Record<UserRole, string> = {
  customer: 'customers/profile-images',
  service_provider: 'service-providers/profile-images',
  event_planner: 'event-planners/profile-images',
  venue_provider: 'venue-providers/profile-images',
  admin: 'admins/profile-images',
  super_admin: 'super-admins/profile-images'
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
  static async uploadImages(files: Express.Multer.File[], folderSegment = 'uploads'): Promise<UploadedImage[]> {
    if (!hasCloudinaryConfig()) {
      throw new AppError(500, 'Cloudinary is not configured');
    }

    if (!files.length) {
      throw new AppError(400, 'At least one image is required');
    }

    const normalizedFolderSegment = folderSegment
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '');

    const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${normalizedFolderSegment || 'uploads'}`;

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

  static async uploadVenueImages(files: Express.Multer.File[]): Promise<UploadedImage[]> {
    return this.uploadImages(files, 'venues');
  }

  static async uploadProfileImage(userId: string, role: UserRole, file: Express.Multer.File) {
    if (!file) {
      throw new AppError(400, 'Profile image must be sent using the image field');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const [uploaded] = await this.uploadImages([file], roleProfileFolderMap[role]);

    if (user.profileImage?.publicId) {
      await getCloudinary().uploader.destroy(user.profileImage.publicId, {
        resource_type: 'image'
      });
    }

    user.profileImage = {
      url: uploaded.url,
      publicId: uploaded.publicId
    };
    await user.save();

    return {
      role,
      profileImage: user.profileImage
    };
  }
}

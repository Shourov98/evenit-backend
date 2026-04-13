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

const roleCoverFolderMap: Record<UserRole, string> = {
  customer: 'customers/cover-images',
  service_provider: 'service-providers/cover-images',
  event_planner: 'event-planners/cover-images',
  venue_provider: 'venue-providers/cover-images',
  admin: 'admins/cover-images',
  super_admin: 'super-admins/cover-images'
};

const uploadBuffer = (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'auto' = 'image'
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        folder,
        resource_type: resourceType
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed while storing the file'));
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });

export class UploadService {
  private static async replaceUserImageAsset(
    userId: string,
    role: UserRole,
    file: Express.Multer.File,
    field: 'profileImage' | 'coverImage'
  ) {
    if (!file) {
      throw new AppError(400, `${field} upload failed: send the file in the ${field} field`);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const folderMap = field === 'profileImage' ? roleProfileFolderMap : roleCoverFolderMap;
    const [uploaded] = await this.uploadImages([file], folderMap[role]);
    const existingAsset = user[field];

    if (existingAsset?.publicId) {
      await getCloudinary().uploader.destroy(existingAsset.publicId, {
        resource_type: 'image'
      });
    }

    user[field] = {
      url: uploaded.url,
      publicId: uploaded.publicId
    };
    await user.save();

    return user[field];
  }

  private static async uploadFiles(
    files: Express.Multer.File[],
    folderSegment = 'uploads',
    resourceType: 'image' | 'auto' = 'image'
  ): Promise<UploadedImage[]> {
    if (!hasCloudinaryConfig()) {
      throw new AppError(500, 'File upload is unavailable because Cloudinary credentials are not configured');
    }

    if (!files.length) {
      throw new AppError(400, 'Upload failed: at least one image file is required');
    }

    const normalizedFolderSegment = folderSegment
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '');

    const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${normalizedFolderSegment || 'uploads'}`;

    const uploads = await Promise.all(
      files.map(async (file) => {
        const result = await uploadBuffer(file.buffer, folder, resourceType);

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

  static async uploadImages(files: Express.Multer.File[], folderSegment = 'uploads'): Promise<UploadedImage[]> {
    return this.uploadFiles(files, folderSegment, 'image');
  }

  static async uploadOnboardingDocuments(files: Express.Multer.File[], folderSegment: string): Promise<UploadedImage[]> {
    return this.uploadFiles(files, folderSegment, 'auto');
  }

  static async uploadVenueImages(files: Express.Multer.File[]): Promise<UploadedImage[]> {
    return this.uploadImages(files, 'venues');
  }

  static async uploadProfileImage(userId: string, role: UserRole, file: Express.Multer.File) {
    return {
      role,
      profileImage: await this.replaceUserImageAsset(userId, role, file, 'profileImage')
    };
  }

  static async uploadCoverImage(userId: string, role: UserRole, file: Express.Multer.File) {
    return {
      role,
      coverImage: await this.replaceUserImageAsset(userId, role, file, 'coverImage')
    };
  }
}

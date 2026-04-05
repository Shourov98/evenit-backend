import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { UploadService } from '../uploads/upload.service';

const getFiles = (req: Request): Express.Multer.File[] => {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (!req.files) {
    return [];
  }

  return Object.values(req.files).flat();
};

const ensureObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const uploadOnboardingFiles =
  (roleFolder: 'service-providers' | 'event-planners' | 'venue-providers') =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = getFiles(req);

      if (!files.length) {
        return next();
      }

      const uploaded = await UploadService.uploadOnboardingDocuments(files, `${roleFolder}/onboarding-documents`);
      const uploadedUrls = uploaded.map((item) => item.url);

      const currentBody = ensureObject(req.body);
      const profileInfo = ensureObject(currentBody.profileInfo);
      const verification = ensureObject(profileInfo.verification);

      if (roleFolder === 'service-providers' || roleFolder === 'event-planners') {
        verification.nationalIdOrTradeLicenseFiles = uploadedUrls;
        profileInfo.verification = verification;
      } else if (roleFolder === 'venue-providers') {
        profileInfo.nationalIdOrTradeLicenseFiles = uploadedUrls;
      } else {
        return next(new AppError(500, 'Unsupported onboarding upload configuration'));
      }

      req.body = {
        ...currentBody,
        profileInfo
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };

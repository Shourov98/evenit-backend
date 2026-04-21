import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { parsePagination } from '../../common/utils/pagination';
import { catchAsync } from '../../common/utils/catchAsync';
import { UploadService } from '../uploads/upload.service';
import { VenueProviderService } from './venue-provider.service';

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Authentication required: sign in before managing venues');
  }

  return req.user.userId;
};
const getFiles = (req: Request): Express.Multer.File[] =>
  Array.isArray(req.files) ? req.files : req.files ? Object.values(req.files).flat() : [];

export class VenueProviderController {
  static createVenue = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const files = getFiles(req);
    const uploadedImages = files.length ? await UploadService.uploadImages(files, 'venues') : [];
    const uploadedImageUrls = uploadedImages.map((item) => item.url);
    const payload = {
      ...req.body,
      media: {
        ...(req.body.media || {}),
        galleryImages: [...(req.body.media?.galleryImages || []), ...uploadedImageUrls]
      }
    };

    const venue = await VenueProviderService.create(userId, payload);

    return res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue
    });
  });

  static getVenues = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venues = await VenueProviderService.getPublic(pagination);

    return res.status(200).json({
      success: true,
      meta: venues.meta,
      data: venues.data
    });
  });

  static getOwnVenues = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const pagination = parsePagination(req.query as Record<string, unknown>);
    const publishStatus =
      typeof req.query.publishStatus === 'string' ? req.query.publishStatus : undefined;

    const venues = await VenueProviderService.getMine(userId, pagination, {
      publishStatus: publishStatus as 'pending' | 'published' | 'rejected' | undefined
    });

    return res.status(200).json({
      success: true,
      meta: venues.meta,
      data: venues.data
    });
  });

  static getVenueById = catchAsync(async (req: Request, res: Response) => {
    const venue = await VenueProviderService.getPublicById(req.params.venueId);

    return res.status(200).json({
      success: true,
      data: venue
    });
  });

  static updateVenue = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const files = getFiles(req);
    const uploadedImages = files.length ? await UploadService.uploadImages(files, 'venues') : [];
    const uploadedImageUrls = uploadedImages.map((item) => item.url);
    const payload = uploadedImageUrls.length
      ? {
          ...req.body,
          media: {
            ...(req.body.media || {}),
            galleryImages: [...(req.body.media?.galleryImages || []), ...uploadedImageUrls]
          }
        }
      : req.body;

    const venue = await VenueProviderService.update(userId, req.params.venueId, payload);

    return res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      data: venue
    });
  });

  static deleteVenue = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    await VenueProviderService.delete(userId, req.params.venueId);

    return res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  });

  static getAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const availability = await VenueProviderService.getAvailability(
      userId,
      req.params.venueId,
      typeof req.query.month === 'string' ? req.query.month : undefined
    );

    return res.status(200).json({
      success: true,
      data: availability
    });
  });

  static blockAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await VenueProviderService.blockAvailability(userId, req.params.venueId, req.body.date);

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: result
    });
  });

  static unblockAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await VenueProviderService.unblockAvailability(userId, req.params.venueId, req.body.date);

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: result
    });
  });
}

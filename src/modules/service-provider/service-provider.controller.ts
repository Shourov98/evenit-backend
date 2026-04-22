import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { parsePagination } from '../../common/utils/pagination';
import { catchAsync } from '../../common/utils/catchAsync';
import { UploadService } from '../uploads/upload.service';
import { ServiceProviderService } from './service-provider.service';

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Authentication required: sign in before managing services');
  }

  return req.user.userId;
};
const getFiles = (req: Request): Express.Multer.File[] =>
  Array.isArray(req.files) ? req.files : req.files ? Object.values(req.files).flat() : [];

export class ServiceProviderController {
  static createService = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const files = getFiles(req);
    const uploadedImages = files.length ? await UploadService.uploadImages(files, 'services') : [];
    const uploadedImageUrls = uploadedImages.map((item) => item.url);
    const payload = {
      ...req.body,
      media: {
        ...(req.body.media || {}),
        galleryImages: [...(req.body.media?.galleryImages || []), ...uploadedImageUrls]
      }
    };

    const service = await ServiceProviderService.create(userId, payload);

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  });

  static getServices = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const services = await ServiceProviderService.getPublic(pagination);

    return res.status(200).json({
      success: true,
      meta: services.meta,
      data: services.data
    });
  });

  static getOwnServices = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const pagination = parsePagination(req.query as Record<string, unknown>);
    const publishStatus =
      typeof req.query.publishStatus === 'string' ? req.query.publishStatus : undefined;

    const services = await ServiceProviderService.getMine(userId, pagination, {
      publishStatus: publishStatus as 'pending' | 'published' | 'rejected' | undefined
    });

    return res.status(200).json({
      success: true,
      meta: services.meta,
      data: services.data
    });
  });

  static getDashboardAnalytics = catchAsync(async (req: Request, res: Response) => {
    const analytics = await ServiceProviderService.getDashboardAnalytics(getUserId(req));

    return res.status(200).json({
      success: true,
      data: analytics
    });
  });

  static getServiceById = catchAsync(async (req: Request, res: Response) => {
    const service = await ServiceProviderService.getPublicById(req.params.serviceId);

    return res.status(200).json({
      success: true,
      data: service
    });
  });

  static updateService = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const files = getFiles(req);
    const uploadedImages = files.length ? await UploadService.uploadImages(files, 'services') : [];
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

    const service = await ServiceProviderService.update(userId, req.params.serviceId, payload);

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  });

  static deleteService = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    await ServiceProviderService.delete(userId, req.params.serviceId);

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  });

  static getAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const availability = await ServiceProviderService.getAvailability(
      userId,
      req.params.serviceId,
      typeof req.query.month === 'string' ? req.query.month : undefined
    );

    return res.status(200).json({
      success: true,
      data: availability
    });
  });

  static blockAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await ServiceProviderService.blockAvailability(userId, req.params.serviceId, req.body.date);

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: result
    });
  });

  static unblockAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await ServiceProviderService.unblockAvailability(userId, req.params.serviceId, req.body.date);

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: result
    });
  });
}

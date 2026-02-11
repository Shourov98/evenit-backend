import { Request, Response } from 'express';
import { parsePagination } from '../../common/utils/pagination';
import { catchAsync } from '../../common/utils/catchAsync';
import { ServiceProviderService } from './service-provider.service';

const getUserId = (req: Request): string | null => req.user?.userId || null;

export class ServiceProviderController {
  static createService = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const service = await ServiceProviderService.create(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  });

  static getMyServices = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pagination = parsePagination(req.query as Record<string, unknown>);
    const services = await ServiceProviderService.getMine(userId, pagination);

    return res.status(200).json({
      success: true,
      meta: services.meta,
      data: services.data
    });
  });

  static getServiceById = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const service = await ServiceProviderService.getById(userId, req.params.serviceId);

    return res.status(200).json({
      success: true,
      data: service
    });
  });

  static updateService = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const service = await ServiceProviderService.update(userId, req.params.serviceId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  });

  static deleteService = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await ServiceProviderService.delete(userId, req.params.serviceId);

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  });
}

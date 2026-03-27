import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { EventPlannerService } from '../event-planner/event-planner.service';
import { ServiceProviderService } from '../service-provider/service-provider.service';
import { VenueProviderService } from '../venue-provider/venue-provider.service';

export class PublicController {
  static getPublishedServices = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const services = await ServiceProviderService.getPublic(pagination);

    return res.status(200).json({
      success: true,
      meta: services.meta,
      data: services.data
    });
  });

  static getPublishedVenues = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venues = await VenueProviderService.getPublic(pagination);

    return res.status(200).json({
      success: true,
      meta: venues.meta,
      data: venues.data
    });
  });

  static getPublishedEventPlanners = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const eventPlanners = await EventPlannerService.getPublic(pagination);

    return res.status(200).json({
      success: true,
      meta: eventPlanners.meta,
      data: eventPlanners.data
    });
  });
}

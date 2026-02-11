import { Request, Response } from 'express';
import { parsePagination } from '../../common/utils/pagination';
import { catchAsync } from '../../common/utils/catchAsync';
import { VenueProviderService } from './venue-provider.service';

const getUserId = (req: Request): string | null => req.user?.userId || null;

export class VenueProviderController {
  static createVenue = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const venue = await VenueProviderService.create(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue
    });
  });

  static getMyVenues = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const pagination = parsePagination(req.query as Record<string, unknown>);
    const venues = await VenueProviderService.getMine(userId, pagination);

    return res.status(200).json({
      success: true,
      meta: venues.meta,
      data: venues.data
    });
  });

  static getVenueById = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const venue = await VenueProviderService.getById(userId, req.params.venueId);

    return res.status(200).json({
      success: true,
      data: venue
    });
  });

  static updateVenue = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const venue = await VenueProviderService.update(userId, req.params.venueId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      data: venue
    });
  });

  static deleteVenue = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await VenueProviderService.delete(userId, req.params.venueId);

    return res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  });
}

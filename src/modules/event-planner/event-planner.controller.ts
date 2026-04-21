import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { parsePagination } from '../../common/utils/pagination';
import { catchAsync } from '../../common/utils/catchAsync';
import { EventPlannerService } from './event-planner.service';

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Authentication required: sign in before managing availability');
  }

  return req.user.userId;
};

export class EventPlannerController {
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const eventPlanners = await EventPlannerService.getAll(pagination);

    return res.status(200).json({
      success: true,
      meta: eventPlanners.meta,
      data: eventPlanners.data
    });
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const eventPlanner = await EventPlannerService.getPublicById(req.params.eventPlannerId);

    return res.status(200).json({
      success: true,
      data: eventPlanner
    });
  });

  static getMyAvailability = catchAsync(async (req: Request, res: Response) => {
    const availability = await EventPlannerService.getAvailability(
      getUserId(req),
      typeof req.query.month === 'string' ? req.query.month : undefined
    );

    return res.status(200).json({
      success: true,
      data: availability
    });
  });

  static blockMyAvailability = catchAsync(async (req: Request, res: Response) => {
    const result = await EventPlannerService.blockAvailability(getUserId(req), req.body.date);

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: result
    });
  });

  static unblockMyAvailability = catchAsync(async (req: Request, res: Response) => {
    const result = await EventPlannerService.unblockAvailability(getUserId(req), req.body.date);

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: result
    });
  });
}

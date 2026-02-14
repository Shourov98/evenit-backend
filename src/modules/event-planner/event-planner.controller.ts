import { Request, Response } from 'express';
import { parsePagination } from '../../common/utils/pagination';
import { catchAsync } from '../../common/utils/catchAsync';
import { EventPlannerService } from './event-planner.service';

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
}

import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { NotificationService } from './notification.service';

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Authentication required');
  }

  return req.user.userId;
};

export class NotificationController {
  static getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const filters = {
      isRead: typeof req.query.isRead === 'boolean' ? req.query.isRead : undefined,
      category: typeof req.query.category === 'string' ? (req.query.category as any) : undefined
    };
    const result = await NotificationService.getMyNotifications(userId, pagination, filters);

    return res.status(200).json({
      success: true,
      meta: result.meta,
      data: result.data
    });
  });

  static getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await NotificationService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      data: result
    });
  });

  static markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await NotificationService.markAsRead(req.params.notificationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: result
    });
  });

  static markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    await NotificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  });
}

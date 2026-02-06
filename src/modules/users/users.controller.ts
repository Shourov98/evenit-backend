import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { UsersService } from './users.service';

export class UsersController {
  static create = catchAsync(async (req: Request, res: Response) => {
    const result = await UsersService.create(req.body as { name: string });
    return res.status(201).json({ success: true, data: result });
  });

  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const result = await UsersService.getAll();
    return res.status(200).json({ success: true, data: result });
  });
}

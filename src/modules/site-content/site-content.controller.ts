import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { SiteContentSection } from './site-content.model';
import { SiteContentService } from './site-content.service';

export class SiteContentController {
  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const data = await SiteContentService.getAll();

    return res.status(200).json({
      success: true,
      data
    });
  });

  static getBySection = catchAsync(async (req: Request, res: Response) => {
    const data = await SiteContentService.getBySection(req.params.section as SiteContentSection);

    return res.status(200).json({
      success: true,
      data
    });
  });

  static upsert = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required: sign in before updating site content');
    }

    const data = await SiteContentService.upsert(
      req.params.section as SiteContentSection,
      req.body,
      {
        userId: req.user.userId,
        fullName: req.user.fullName,
        email: req.user.email
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Site content saved successfully',
      data
    });
  });
}

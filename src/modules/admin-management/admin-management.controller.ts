import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { AdminManagementService } from './admin-management.service';

const getApprover = (req: Request): { name: string; email: string } | null => {
  if (!req.user?.fullName || !req.user?.email) {
    return null;
  }

  return {
    name: req.user.fullName,
    email: req.user.email
  };
};

export class AdminManagementController {
  static approveVenue = catchAsync(async (req: Request, res: Response) => {
    const approver = getApprover(req);
    if (!approver) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const venue = await AdminManagementService.approveVenue(req.params.venueId, approver);
    return res.status(200).json({
      success: true,
      message: 'Venue approved successfully',
      data: venue
    });
  });

  static rejectVenue = catchAsync(async (req: Request, res: Response) => {
    const venue = await AdminManagementService.rejectVenue(req.params.venueId);
    return res.status(200).json({
      success: true,
      message: 'Venue rejected successfully',
      data: venue
    });
  });

  static approveService = catchAsync(async (req: Request, res: Response) => {
    const approver = getApprover(req);
    if (!approver) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const service = await AdminManagementService.approveService(req.params.serviceId, approver);
    return res.status(200).json({
      success: true,
      message: 'Service approved successfully',
      data: service
    });
  });

  static rejectService = catchAsync(async (req: Request, res: Response) => {
    const service = await AdminManagementService.rejectService(req.params.serviceId);
    return res.status(200).json({
      success: true,
      message: 'Service rejected successfully',
      data: service
    });
  });
}


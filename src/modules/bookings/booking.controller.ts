import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { AppError } from '../../common/errors/AppError';
import { BookingService } from './booking.service';

const getUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  return req.user;
};

export class BookingController {
  static createBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.create(user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  });

  static createServiceBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.createForTarget(user.userId, 'service', req.params.serviceId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Service booking created successfully',
      data: booking
    });
  });

  static createVenueBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.createForTarget(user.userId, 'venue', req.params.venueId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Venue booking created successfully',
      data: booking
    });
  });

  static createEventPlannerBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.createForTarget(
      user.userId,
      'event',
      req.params.eventPlannerId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: 'Event planner booking created successfully',
      data: booking
    });
  });

  static getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const bookings = await BookingService.getMyBookings(user.userId, pagination);

    return res.status(200).json({
      success: true,
      meta: bookings.meta,
      data: bookings.data
    });
  });

  static getProviderBookings = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const bookings = await BookingService.getProviderBookings(user.userId, pagination);

    return res.status(200).json({
      success: true,
      meta: bookings.meta,
      data: bookings.data
    });
  });

  static getBookingById = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.getById(req.params.bookingId, user.userId, user.role);

    return res.status(200).json({
      success: true,
      data: booking
    });
  });

  static approveBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.approve(req.params.bookingId, user.userId);

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });
  });

  static rejectBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.reject(req.params.bookingId, user.userId, req.body.reason);

    return res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });
  });

  static cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.cancel(req.params.bookingId, user.userId);

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  });
}

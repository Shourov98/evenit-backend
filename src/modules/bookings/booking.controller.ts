import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { AppError } from '../../common/errors/AppError';
import { BookingService } from './booking.service';

type BookingStatusFilter = 'pending' | 'approved' | 'rejected' | 'completed' | 'confirmed' | 'cancelled';

const getUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required: sign in before accessing bookings');
  }

  return req.user;
};

export class BookingController {
  private static getStatusFilter(req: Request): BookingStatusFilter | undefined {
    const status = req.query.status;
    return typeof status === 'string' ? (status as BookingStatusFilter) : undefined;
  }

  static createBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.create(user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  });

  static getServiceBookingContext = catchAsync(async (req: Request, res: Response) => {
    const data = await BookingService.getServiceBookingContext(req.params.serviceId);

    return res.status(200).json({
      success: true,
      data
    });
  });

  static getVenueBookingContext = catchAsync(async (req: Request, res: Response) => {
    const data = await BookingService.getVenueBookingContext(req.params.venueId);

    return res.status(200).json({
      success: true,
      data
    });
  });

  static getEventPlannerBookingContext = catchAsync(async (req: Request, res: Response) => {
    const data = await BookingService.getEventPlannerBookingContext(req.params.eventPlannerId);

    return res.status(200).json({
      success: true,
      data
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
    const bookings = await BookingService.getMyBookings(
      user.userId,
      pagination,
      BookingController.getStatusFilter(req)
    );

    return res.status(200).json({
      success: true,
      meta: bookings.meta,
      data: bookings.data
    });
  });

  static getProviderBookings = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const bookings = await BookingService.getProviderBookings(
      user.userId,
      pagination,
      BookingController.getStatusFilter(req)
    );

    return res.status(200).json({
      success: true,
      meta: bookings.meta,
      data: bookings.data
    });
  });

  static getServiceProviderBookings = BookingController.getProviderBookings;

  static getVenueProviderBookings = BookingController.getProviderBookings;

  static getEventPlannerBookings = BookingController.getProviderBookings;

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
    const booking = await BookingService.approve(
      req.params.bookingId,
      user.userId,
      user.role as 'venue_provider' | 'service_provider' | 'event_planner'
    );

    return res.status(200).json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking
    });
  });

  static approveServiceProviderBooking = BookingController.approveBooking;

  static approveVenueProviderBooking = BookingController.approveBooking;

  static approveEventPlannerBooking = BookingController.approveBooking;

  static rejectBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.reject(
      req.params.bookingId,
      user.userId,
      user.role as 'venue_provider' | 'service_provider' | 'event_planner',
      req.body.reason
    );

    return res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });
  });

  static rejectServiceProviderBooking = BookingController.rejectBooking;

  static rejectVenueProviderBooking = BookingController.rejectBooking;

  static rejectEventPlannerBooking = BookingController.rejectBooking;

  static cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.cancel(req.params.bookingId, user.userId);

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  });

  static completeBooking = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const booking = await BookingService.complete(req.params.bookingId, user.userId);

    return res.status(200).json({
      success: true,
      message: 'Booking completed successfully',
      data: booking
    });
  });
}

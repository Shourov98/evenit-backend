import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { env } from '../../config/env';
import { hydrateUserSubscription, UserModel } from '../auth/auth.model';
import { IServiceProviderService, ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { IBooking, BookingModel } from './booking.model';
import { IVenue, VenueProviderVenueModel } from '../venue-provider/venue-provider.model';

type CreateBookingPayload = {
  targetType: 'venue' | 'service' | 'event';
  targetId: string;
  bookingDate: string;
  timeSlots: string[];
  durationHours?: number;
  location?: string;
  specialInstructions?: string;
};

type BookingStatusFilter = 'pending' | 'approved' | 'rejected' | 'completed' | 'confirmed' | 'cancelled';

const activeBookingStatuses = ['pending', 'approved', 'confirmed', 'completed'] as const;

const ensureObjectId = (id: string, label: string): void => {
  if (!isValidObjectId(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

const sortTimeSlots = (timeSlots: string[]): string[] => [...timeSlots].sort((a, b) => a.localeCompare(b));

const hasOverlap = (left: string[], right: string[]): boolean => {
  const rightSet = new Set(right);
  return left.some((slot) => rightSet.has(slot));
};

const getPlatformFeePercent = (): number => {
  const parsed = Number(env.PLATFORM_FEE_PERCENT);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 10;
  }

  return parsed;
};

const canAccessBooking = (booking: IBooking, actorId: string, role: string): boolean => {
  if (role === 'admin' || role === 'super_admin') {
    return true;
  }

  return String(booking.customerId) === actorId || String(booking.providerId) === actorId;
};

const computeServiceSubtotal = (service: IServiceProviderService, durationHours: number): number => {
  switch (service.pricing.pricingType) {
    case 'hourly':
      return service.pricing.amount * durationHours;
    case 'daily':
      return service.pricing.amount;
    case 'package':
      return service.pricing.amount;
    case 'fixed':
    default:
      return service.pricing.amount;
  }
};

const applyDiscount = (
  subtotal: number,
  discount?: { type: 'percentage' | 'fixed'; value: number }
): number => {
  if (!discount) {
    return subtotal;
  }

  if (discount.type === 'percentage') {
    return Math.max(0, subtotal - (subtotal * discount.value) / 100);
  }

  return Math.max(0, subtotal - discount.value);
};

const parseTimeSlotHour = (timeSlot: string): number => Number.parseInt(timeSlot.split(':')[0] || '', 10);

const ensureVenueAvailability = (venue: IVenue, bookingDate: string, timeSlots: string[]): void => {
  const override = venue.availabilityOverrides.find((item) => item.date === bookingDate);
  if (!override) {
    return;
  }

  const selectedHours = timeSlots.map(parseTimeSlotHour);
  for (const hour of selectedHours) {
    const slot = override.slots.find((item) => item.hour === hour);
    if (slot && slot.status !== 'available') {
      throw new AppError(409, `Venue is ${slot.status} on ${bookingDate} at ${String(hour).padStart(2, '0')}:00`);
    }
  }
};

const ensureServiceAvailability = (service: IServiceProviderService, bookingDate: string, timeSlots: string[]): void => {
  const override = service.availabilityOverrides.find((item) => item.date === bookingDate);
  if (!override) {
    return;
  }

  const selectedHours = timeSlots.map(parseTimeSlotHour);
  for (const hour of selectedHours) {
    const slot = override.slots.find((item) => item.hour === hour);
    if (slot && slot.status !== 'available') {
      throw new AppError(409, `Service is ${slot.status} on ${bookingDate} at ${String(hour).padStart(2, '0')}:00`);
    }
  }
};

export class BookingService {
  private static buildStatusFilter(status?: BookingStatusFilter) {
    if (!status) {
      return {};
    }

    if (status === 'approved') {
      return { status: { $in: ['approved', 'confirmed'] as const } };
    }

    return { status };
  }

  static async createForTarget(
    customerId: string,
    targetType: CreateBookingPayload['targetType'],
    targetId: string,
    payload: Omit<CreateBookingPayload, 'targetType' | 'targetId'>
  ) {
    return this.create(customerId, {
      ...payload,
      targetType,
      targetId
    });
  }

  static async create(customerId: string, payload: CreateBookingPayload) {
    ensureObjectId(customerId, 'customerId');
    ensureObjectId(payload.targetId, 'targetId');

    const customer = await UserModel.findById(customerId);
    if (!customer || customer.role !== 'customer') {
      throw new AppError(403, 'Only customers can create bookings');
    }
    const hydratedSubscription = hydrateUserSubscription(customer.role, customer.subscription);
    if (JSON.stringify(customer.subscription) !== JSON.stringify(hydratedSubscription)) {
      customer.subscription = hydratedSubscription;
      await customer.save();
    }
    if (customer.subscription.status !== 'subscribed') {
      throw new AppError(403, 'A subscribed account is required to create a booking');
    }

    const timeSlots = sortTimeSlots(payload.timeSlots);
    const durationHours = payload.durationHours ?? timeSlots.length;

    if (durationHours !== timeSlots.length) {
      throw new AppError(400, 'durationHours must match the number of selected time slots');
    }

    let providerId: Types.ObjectId;
    let subtotal = 0;
    let currency = 'BDT';

    if (payload.targetType === 'venue') {
      const venue = await VenueProviderVenueModel.findOne({
        _id: payload.targetId,
        isDeleted: false,
        publishStatus: 'published'
      });

      if (!venue) {
        throw new AppError(404, 'Venue not found');
      }

      ensureVenueAvailability(venue, payload.bookingDate, timeSlots);
      providerId = venue.ownerId;
      subtotal = venue.pricing.basePrice * durationHours;
      currency = venue.pricing.currency;
    } else if (payload.targetType === 'service') {
      const service = await ServiceProviderServiceModel.findOne({
        _id: payload.targetId,
        isDeleted: false,
        publishStatus: 'published'
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      ensureServiceAvailability(service, payload.bookingDate, timeSlots);
      providerId = service.ownerId;
      subtotal = applyDiscount(computeServiceSubtotal(service, durationHours), service.pricing.discount);
      currency = service.pricing.currency;
    } else {
      const eventPlanner = await UserModel.findOne({
        _id: payload.targetId,
        role: 'event_planner',
        isEmailVerified: true,
        'onboarding.eventProvider': { $exists: true }
      });

      if (!eventPlanner) {
        throw new AppError(404, 'Event planner not found');
      }

      providerId = eventPlanner._id as Types.ObjectId;
      subtotal = 0;
      currency = 'BDT';
    }

    const conflictingBookings = await BookingModel.find({
      targetType: payload.targetType,
      targetId: payload.targetId,
      bookingDate: payload.bookingDate,
      status: { $in: activeBookingStatuses }
    }).select('timeSlots');

    const hasConflictingBooking = conflictingBookings.some((booking) => hasOverlap(booking.timeSlots, timeSlots));
    if (hasConflictingBooking) {
      throw new AppError(409, 'One or more selected time slots are already booked');
    }

    const platformFeeAmount = Number(((subtotal * getPlatformFeePercent()) / 100).toFixed(2));
    const taxAmount = 0;
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    return BookingModel.create({
      customerId,
      providerId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      bookingDate: payload.bookingDate,
      timeSlots,
      durationHours,
      location: payload.location,
      specialInstructions: payload.specialInstructions,
      pricing: {
        unitAmount: Number((subtotal / durationHours).toFixed(2)),
        subtotal,
        taxAmount,
        platformFeeAmount,
        totalAmount,
        currency: currency.toUpperCase()
      },
      status: 'pending',
      payment: {
        status: 'covered_by_subscription'
      }
    });
  }

  static async getMyBookings(customerId: string, pagination: PaginationOptions, status?: BookingStatusFilter) {
    ensureObjectId(customerId, 'customerId');

    return paginateModel(
      BookingModel,
      {
        customerId,
        ...this.buildStatusFilter(status)
      },
      pagination
    );
  }

  static async getProviderBookings(providerId: string, pagination: PaginationOptions, status?: BookingStatusFilter) {
    ensureObjectId(providerId, 'providerId');

    return paginateModel(
      BookingModel,
      {
        providerId,
        ...this.buildStatusFilter(status)
      },
      pagination
    );
  }

  static async getById(bookingId: string, actorId: string, role: string) {
    ensureObjectId(bookingId, 'bookingId');
    ensureObjectId(actorId, 'actorId');

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (!canAccessBooking(booking, actorId, role)) {
      throw new AppError(403, 'Forbidden');
    }

    return booking;
  }

  static async approve(bookingId: string, providerId: string) {
    const booking = await this.getById(bookingId, providerId, 'venue_provider');
    if (String(booking.providerId) !== providerId) {
      throw new AppError(403, 'Only the provider can approve this booking');
    }

    if (booking.status !== 'pending') {
      throw new AppError(400, 'Only pending bookings can be approved');
    }

    booking.status = 'confirmed';
    booking.approvedAt = new Date();
    booking.rejectedAt = undefined;
    booking.rejectionReason = undefined;
    booking.payment.status = 'covered_by_subscription';
    booking.payment.coveredAt = new Date();
    await booking.save();

    return booking;
  }

  static async reject(bookingId: string, providerId: string, reason?: string) {
    const booking = await this.getById(bookingId, providerId, 'venue_provider');
    if (String(booking.providerId) !== providerId) {
      throw new AppError(403, 'Only the provider can reject this booking');
    }

    if (booking.status !== 'pending') {
      throw new AppError(400, 'Only pending bookings can be rejected');
    }

    booking.status = 'rejected';
    booking.rejectedAt = new Date();
    booking.rejectionReason = reason;
    booking.payment.status = 'covered_by_subscription';
    booking.payment.coveredAt = undefined;
    await booking.save();

    return booking;
  }

  static async cancel(bookingId: string, customerId: string) {
    const booking = await this.getById(bookingId, customerId, 'customer');
    if (String(booking.customerId) !== customerId) {
      throw new AppError(403, 'Only the customer can cancel this booking');
    }

    if (booking.status === 'rejected' || booking.status === 'cancelled' || booking.status === 'completed') {
      throw new AppError(400, 'Booking cannot be cancelled');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    return booking;
  }
}

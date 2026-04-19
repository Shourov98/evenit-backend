import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import {
  availabilityEntriesToCalendar,
  AvailabilityEntry,
  BOOKING_END_HOUR,
  BOOKING_START_HOUR,
  mergeCalendars,
  normalizeHours
} from '../../common/utils/availability';
import { buildPaginationMeta, PaginationOptions } from '../../common/utils/pagination';
import { env } from '../../config/env';
import { hydrateUserSubscription, UserModel } from '../auth/auth.model';
import { OrderChatService } from '../order-chat/order-chat.service';
import { IServiceProviderService, ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { IBooking, BookingModel } from './booking.model';
import { IVenue, VenueProviderVenueModel } from '../venue-provider/venue-provider.model';

type CreateBookingPayload = {
  targetType: 'venue' | 'service' | 'event';
  targetId: string;
  bookingDate: string;
  hours: number[];
  guest_count?: number;
  location?: string;
  specialInstructions?: string;
};

type BookingContextCalendar = Record<
  string,
  {
    bookedHours: number[];
    blockedHours: number[];
  }
>;

type BookingStatusFilter = 'pending' | 'approved' | 'rejected' | 'completed' | 'confirmed' | 'cancelled';

const activeBookingStatuses = ['pending', 'approved', 'confirmed'] as const;

const ensureObjectId = (id: string, label: string): void => {
  if (!isValidObjectId(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

const hasOverlap = (left: number[], right: number[]): boolean => {
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

const getReferenceId = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Types.ObjectId) {
    return String(value);
  }

  if (typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }

  return String(value);
};

const canAccessBooking = (booking: IBooking, actorId: string, role: string): boolean => {
  if (role === 'admin' || role === 'super_admin') {
    return true;
  }

  return getReferenceId(booking.customerId) === actorId || getReferenceId(booking.providerId) === actorId;
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

const getCurrentUtcDate = (): string => new Date().toISOString().slice(0, 10);

export const isPastBookingDate = (bookingDate: string): boolean => bookingDate < getCurrentUtcDate();
export const isFutureBookingDate = (bookingDate: string): boolean => bookingDate > getCurrentUtcDate();

export const buildReservedSlots = (
  targetType: CreateBookingPayload['targetType'],
  targetId: string,
  bookingDate: string,
  hours: number[]
): string[] => hours.map((hour) => `${targetType}:${targetId}:${bookingDate}:${hour}`);

const getCurrentAndNextMonthWindow = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const fromDate = new Date(Date.UTC(year, month, 1));
  const toDate = new Date(Date.UTC(year, month + 2, 0));

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    currentMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
    nextMonth: `${toDate.getUTCFullYear()}-${String(toDate.getUTCMonth() + 1).padStart(2, '0')}`
  };
};

const filterCalendarToRange = (
  calendar: Record<string, number[]>,
  range: { from: string; to: string }
): Record<string, number[]> =>
  Object.fromEntries(
    Object.entries(calendar)
      .filter(([date]) => date >= range.from && date <= range.to)
      .sort(([left], [right]) => left.localeCompare(right))
  );

const buildBookedCalendar = async (
  targetType: CreateBookingPayload['targetType'],
  targetId: string,
  range: { from: string; to: string }
): Promise<Record<string, number[]>> => {
  const bookings = await BookingModel.find({
    targetType,
    targetId,
    status: { $in: activeBookingStatuses },
    bookingDate: {
      $gte: range.from,
      $lte: range.to
    }
  }).select('bookingDate hours');

  const calendar: Record<string, number[]> = {};
  for (const booking of bookings) {
    calendar[booking.bookingDate] = normalizeHours([...(calendar[booking.bookingDate] ?? []), ...booking.hours]);
  }

  return calendar;
};

const buildAvailabilityView = (
  blockedCalendar: Record<string, number[]>,
  bookedCalendar: Record<string, number[]>
): BookingContextCalendar => {
  const dates = new Set([...Object.keys(blockedCalendar), ...Object.keys(bookedCalendar)]);

  return Object.fromEntries(
    [...dates]
      .sort((left, right) => left.localeCompare(right))
      .map((date) => [
        date,
        {
          bookedHours: bookedCalendar[date] ?? [],
          blockedHours: blockedCalendar[date] ?? []
        }
      ])
  );
};

const serializeProvider = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profileImage?: unknown;
  onboarding?: Record<string, unknown> | null;
} | null | undefined) => {
  if (!user) {
    throw new AppError(404, 'Booking provider not found');
  }

  const onboarding = user.onboarding ?? null;

  return {
    _id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    role: user.role,
    profileImage:
      user.profileImage && typeof user.profileImage === 'object' && 'url' in user.profileImage
        ? user.profileImage.url
        : null,
    serviceProvider:
      user.role === 'service_provider' && onboarding && typeof onboarding === 'object' && 'serviceProvider' in onboarding
        ? (onboarding as Record<string, any>).serviceProvider?.profileInfo ?? null
        : null,
    venueProvider:
      user.role === 'venue_provider' && onboarding && typeof onboarding === 'object' && 'venueProvider' in onboarding
        ? (onboarding as Record<string, any>).venueProvider?.profileInfo ?? null
        : null,
    eventPlanner:
      user.role === 'event_planner' && onboarding && typeof onboarding === 'object' && 'eventProvider' in onboarding
        ? (onboarding as Record<string, any>).eventProvider?.profileInfo ?? null
        : null
  };
};

const serializeBookingParty = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profileImage?: unknown;
  coverImage?: unknown;
  serviceCategories?: string[];
  onboarding?: Record<string, unknown> | null;
} | null | undefined) => {
  if (!user) {
    return null;
  }

  const onboarding = user.onboarding ?? null;

  return {
    _id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    role: user.role,
    profileImage:
      user.profileImage && typeof user.profileImage === 'object' && 'url' in user.profileImage
        ? user.profileImage.url
        : null,
    coverImage:
      user.coverImage && typeof user.coverImage === 'object' && 'url' in user.coverImage
        ? user.coverImage.url
        : null,
    serviceCategories: Array.isArray(user.serviceCategories) ? user.serviceCategories : [],
    serviceProvider:
      user.role === 'service_provider' && onboarding && typeof onboarding === 'object' && 'serviceProvider' in onboarding
        ? (onboarding as Record<string, any>).serviceProvider?.profileInfo ?? null
        : null,
    venueProvider:
      user.role === 'venue_provider' && onboarding && typeof onboarding === 'object' && 'venueProvider' in onboarding
        ? (onboarding as Record<string, any>).venueProvider?.profileInfo ?? null
        : null,
    eventPlanner:
      user.role === 'event_planner' && onboarding && typeof onboarding === 'object' && 'eventProvider' in onboarding
        ? (onboarding as Record<string, any>).eventProvider?.profileInfo ?? null
        : null
  };
};

const ensureHoursAvailable = (
  calendarEntries: AvailabilityEntry[] | undefined,
  bookingDate: string,
  hours: number[],
  label: string
): void => {
  const calendar = availabilityEntriesToCalendar(calendarEntries);
  const blockedHours = calendar[bookingDate] ?? [];

  for (const hour of hours) {
    if (blockedHours.includes(hour)) {
      throw new AppError(409, `${label} is booked on ${bookingDate} at ${String(hour).padStart(2, '0')}:00`);
    }
  }
};

export class BookingService {
  private static readonly bookingPartyPopulate = [
    {
      path: 'customerId',
      model: UserModel,
      select: 'fullName email phoneNumber role profileImage coverImage serviceCategories onboarding'
    },
    {
      path: 'providerId',
      model: UserModel,
      select: 'fullName email phoneNumber role profileImage coverImage serviceCategories onboarding'
    }
  ] as const;

  private static buildStatusFilter(status?: BookingStatusFilter) {
    if (!status) {
      return {};
    }

    if (status === 'approved') {
      return { status: { $in: ['approved', 'confirmed'] as const } };
    }

    return { status };
  }

  private static async ensureSubscribedUser(userId: string, role: 'customer' | 'event_planner' | 'service_provider' | 'venue_provider') {
    const user = await UserModel.findById(userId);

    if (!user || user.role !== role) {
      throw new AppError(403, 'Access denied for this booking action');
    }

    const hydratedSubscription = hydrateUserSubscription(user.role, user.subscription);
    if (JSON.stringify(user.subscription) !== JSON.stringify(hydratedSubscription)) {
      user.subscription = hydratedSubscription;
      await user.save();
    }

    if (user.subscription.status !== 'subscribed') {
      throw new AppError(403, 'A subscribed account is required for this action');
    }

    return user;
  }

  private static serializeBookingDocument(booking: any) {
    const raw = typeof booking?.toObject === 'function' ? booking.toObject() : booking;

    return {
      ...raw,
      customerId: getReferenceId(raw.customerId),
      providerId: getReferenceId(raw.providerId),
      conversationId: getReferenceId(raw.conversationId) || null,
      targetId: getReferenceId(raw.targetId),
      customer:
        raw.customerId && typeof raw.customerId === 'object' && 'fullName' in raw.customerId
          ? serializeBookingParty(raw.customerId)
          : null,
      provider:
        raw.providerId && typeof raw.providerId === 'object' && 'fullName' in raw.providerId
          ? serializeBookingParty(raw.providerId)
          : null
    };
  }

  private static async findAccessibleBookingDocument(bookingId: string, actorId: string, role: string) {
    ensureObjectId(bookingId, 'bookingId');
    ensureObjectId(actorId, 'actorId');

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (!canAccessBooking(booking, actorId, role)) {
      throw new AppError(403, 'Access denied: you are not allowed to access this booking');
    }

    return booking;
  }

  private static async getTargetForCreate(payload: CreateBookingPayload) {
    if (payload.targetType === 'venue') {
      if (typeof payload.guest_count !== 'number') {
        throw new AppError(400, 'guest_count is required for venue bookings');
      }

      const venue = await VenueProviderVenueModel.findOne({
        _id: payload.targetId,
        isDeleted: false,
        publishStatus: 'published'
      });

      if (!venue) {
        throw new AppError(404, 'Venue not found');
      }

      if (payload.guest_count > venue.capacity.maximumGuests) {
        throw new AppError(400, `guest_count cannot exceed venue maximumGuests (${venue.capacity.maximumGuests})`);
      }

      ensureHoursAvailable(venue.availabilityCalendar, payload.bookingDate, payload.hours, 'Venue');
      return {
        providerId: venue.ownerId,
        subtotal: venue.pricing.basePrice * payload.hours.length,
        currency: venue.pricing.currency,
        target: venue
      };
    }

    if (payload.targetType === 'service') {
      const service = await ServiceProviderServiceModel.findOne({
        _id: payload.targetId,
        isDeleted: false,
        publishStatus: 'published'
      });

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      ensureHoursAvailable(service.availabilityCalendar, payload.bookingDate, payload.hours, 'Service');
      return {
        providerId: service.ownerId,
        subtotal: applyDiscount(computeServiceSubtotal(service, payload.hours.length), service.pricing.discount),
        currency: service.pricing.currency,
        target: service
      };
    }

    const eventPlanner = await UserModel.findOne({
      _id: payload.targetId,
      role: 'event_planner',
      isEmailVerified: true,
      'onboarding.eventProvider': { $exists: true }
    });

    if (!eventPlanner) {
      throw new AppError(404, 'Event planner not found');
    }

    ensureHoursAvailable(eventPlanner.availabilityCalendar, payload.bookingDate, payload.hours, 'Event planner');
    return {
      providerId: eventPlanner._id as Types.ObjectId,
      subtotal: 0,
      currency: eventPlanner.subscription.payment.currency,
      target: eventPlanner
    };
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

    if (isPastBookingDate(payload.bookingDate)) {
      throw new AppError(400, 'bookingDate cannot be in the past');
    }

    const customer = await this.ensureSubscribedUser(customerId, 'customer');
    const hours = normalizeHours(payload.hours);
    const durationHours = hours.length;

    const targetData = await this.getTargetForCreate({
      ...payload,
      hours
    });

    const conflictingBookings = await BookingModel.find({
      targetType: payload.targetType,
      targetId: payload.targetId,
      bookingDate: payload.bookingDate,
      status: { $in: activeBookingStatuses }
    }).select('hours');

    const hasConflictingBooking = conflictingBookings.some((booking) => hasOverlap(booking.hours, hours));
    if (hasConflictingBooking) {
      throw new AppError(409, 'One or more selected hours are already booked');
    }

    const platformFeeAmount = Number(((targetData.subtotal * getPlatformFeePercent()) / 100).toFixed(2));
    const taxAmount = 0;
    const totalAmount = Number((targetData.subtotal + taxAmount).toFixed(2));

    try {
      return await BookingModel.create({
        customerId,
        providerId: targetData.providerId,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reservedSlots: buildReservedSlots(payload.targetType, payload.targetId, payload.bookingDate, hours),
        bookingDate: payload.bookingDate,
        hours,
        guest_count: payload.guest_count,
        durationHours,
        location: payload.location,
        specialInstructions: payload.specialInstructions,
        pricing: {
          unitAmount: Number((targetData.subtotal / durationHours || 0).toFixed(2)),
          subtotal: targetData.subtotal,
          taxAmount,
          platformFeeAmount,
          totalAmount,
          currency: targetData.currency.toUpperCase()
        },
        status: 'pending',
        payment: {
          status: 'covered_by_subscription'
        }
      });
    } catch (error) {
      const duplicateKeyError = error as { code?: number };
      if (duplicateKeyError?.code === 11000) {
        throw new AppError(409, 'One or more selected hours are already booked');
      }

      throw error;
    }
  }

  static async getServiceBookingContext(serviceId: string) {
    ensureObjectId(serviceId, 'serviceId');
    const service = await ServiceProviderServiceModel.findOne({
      _id: serviceId,
      isDeleted: false,
      publishStatus: 'published'
    }).populate({
      path: 'ownerId',
      model: UserModel,
      select: 'fullName email phoneNumber role profileImage onboarding.serviceProvider'
    });

    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    const range = getCurrentAndNextMonthWindow();
    const blockedCalendar = filterCalendarToRange(
      availabilityEntriesToCalendar(service.availabilityCalendar),
      range
    );
    const bookedCalendar = await buildBookedCalendar('service', serviceId, range);

    return {
      targetType: 'service',
      target: {
        ...service.toObject(),
        availability: undefined,
        availabilityCalendar: undefined
      },
      provider: serializeProvider(service.ownerId as any),
      bookingMeta: {
        currency: service.pricing.currency,
        durationMode: 'consecutive_hours',
        minHour: BOOKING_START_HOUR,
        maxHour: BOOKING_END_HOUR,
        currentMonth: range.currentMonth,
        nextMonth: range.nextMonth
      },
      availability: buildAvailabilityView(blockedCalendar, bookedCalendar)
    };
  }

  static async getVenueBookingContext(venueId: string) {
    ensureObjectId(venueId, 'venueId');
    const venue = await VenueProviderVenueModel.findOne({
      _id: venueId,
      isDeleted: false,
      publishStatus: 'published'
    }).populate({
      path: 'ownerId',
      model: UserModel,
      select: 'fullName email phoneNumber role profileImage onboarding.venueProvider'
    });

    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    const range = getCurrentAndNextMonthWindow();
    const blockedCalendar = filterCalendarToRange(
      availabilityEntriesToCalendar(venue.availabilityCalendar),
      range
    );
    const bookedCalendar = await buildBookedCalendar('venue', venueId, range);

    return {
      targetType: 'venue',
      target: {
        ...venue.toObject(),
        availability: undefined,
        availabilityCalendar: undefined
      },
      provider: serializeProvider(venue.ownerId as any),
      bookingMeta: {
        currency: venue.pricing.currency,
        durationMode: 'consecutive_hours',
        minHour: BOOKING_START_HOUR,
        maxHour: BOOKING_END_HOUR,
        requiresGuestCount: true,
        maximumGuests: venue.capacity.maximumGuests,
        currentMonth: range.currentMonth,
        nextMonth: range.nextMonth
      },
      availability: buildAvailabilityView(blockedCalendar, bookedCalendar)
    };
  }

  static async getEventPlannerBookingContext(eventPlannerId: string) {
    ensureObjectId(eventPlannerId, 'eventPlannerId');
    const eventPlanner = await UserModel.findOne({
      _id: eventPlannerId,
      role: 'event_planner',
      isEmailVerified: true,
      'onboarding.eventProvider': { $exists: true }
    }).select('fullName email phoneNumber role profileImage onboarding availabilityCalendar subscription');

    if (!eventPlanner) {
      throw new AppError(404, 'Event planner not found');
    }

    const range = getCurrentAndNextMonthWindow();
    const blockedCalendar = filterCalendarToRange(
      availabilityEntriesToCalendar(eventPlanner.availabilityCalendar),
      range
    );
    const bookedCalendar = await buildBookedCalendar('event', eventPlannerId, range);
    const profileInfo = (eventPlanner.onboarding as Record<string, any>)?.eventProvider?.profileInfo ?? null;

    return {
      targetType: 'event',
      target: {
        _id: String(eventPlanner._id),
        fullName: eventPlanner.fullName,
        email: eventPlanner.email,
        phoneNumber: eventPlanner.phoneNumber ?? null,
        role: eventPlanner.role,
        profileImage:
          eventPlanner.profileImage &&
          typeof eventPlanner.profileImage === 'object' &&
          'url' in eventPlanner.profileImage
            ? eventPlanner.profileImage.url
            : null,
        eventPlanner: profileInfo
      },
      provider: serializeProvider(eventPlanner as any),
      bookingMeta: {
        currency: eventPlanner.subscription?.payment?.currency ?? 'BDT',
        durationMode: 'consecutive_hours',
        minHour: BOOKING_START_HOUR,
        maxHour: BOOKING_END_HOUR,
        currentMonth: range.currentMonth,
        nextMonth: range.nextMonth
      },
      availability: buildAvailabilityView(blockedCalendar, bookedCalendar)
    };
  }

  static async getMyBookings(customerId: string, pagination: PaginationOptions, status?: BookingStatusFilter) {
    ensureObjectId(customerId, 'customerId');
    const filter = {
      customerId,
      ...this.buildStatusFilter(status)
    };
    const [bookings, total] = await Promise.all([
      BookingModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate(this.bookingPartyPopulate as any),
      BookingModel.countDocuments(filter)
    ]);

    return {
      meta: buildPaginationMeta(total, pagination),
      data: bookings.map((booking) => this.serializeBookingDocument(booking))
    };
  }

  static async getProviderBookings(providerId: string, pagination: PaginationOptions, status?: BookingStatusFilter) {
    ensureObjectId(providerId, 'providerId');
    const filter = {
      providerId,
      ...this.buildStatusFilter(status)
    };
    const [bookings, total] = await Promise.all([
      BookingModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate(this.bookingPartyPopulate as any),
      BookingModel.countDocuments(filter)
    ]);

    return {
      meta: buildPaginationMeta(total, pagination),
      data: bookings.map((booking) => this.serializeBookingDocument(booking))
    };
  }

  static async getById(bookingId: string, actorId: string, role: string) {
    const booking = await this.findAccessibleBookingDocument(bookingId, actorId, role);
    await OrderChatService.getOrAssignConversationIdForBooking(booking);
    await booking.populate(this.bookingPartyPopulate as any);
    return this.serializeBookingDocument(booking);
  }

  static async approve(bookingId: string, providerId: string, role: 'venue_provider' | 'service_provider' | 'event_planner') {
    await this.ensureSubscribedUser(providerId, role);
    const booking = await this.findAccessibleBookingDocument(bookingId, providerId, role);
    if (getReferenceId(booking.providerId) !== providerId) {
      throw new AppError(403, 'Only the provider can approve this booking');
    }

    if (booking.status !== 'pending') {
      throw new AppError(400, 'Only pending bookings can be approved');
    }

    const conflictingBookings = await BookingModel.find({
      _id: { $ne: booking._id },
      targetType: booking.targetType,
      targetId: booking.targetId,
      bookingDate: booking.bookingDate,
      status: { $in: activeBookingStatuses }
    }).select('hours');

    if (conflictingBookings.some((item) => hasOverlap(item.hours, booking.hours))) {
      throw new AppError(409, 'One or more selected hours are already booked');
    }

    if (booking.targetType === 'venue') {
      const venue = await VenueProviderVenueModel.findById(booking.targetId).select('availabilityCalendar');
      ensureHoursAvailable(venue?.availabilityCalendar, booking.bookingDate, booking.hours, 'Venue');
    } else if (booking.targetType === 'service') {
      const service = await ServiceProviderServiceModel.findById(booking.targetId).select('availabilityCalendar');
      ensureHoursAvailable(service?.availabilityCalendar, booking.bookingDate, booking.hours, 'Service');
    } else {
      const eventPlanner = await UserModel.findById(booking.targetId).select('availabilityCalendar');
      ensureHoursAvailable(eventPlanner?.availabilityCalendar, booking.bookingDate, booking.hours, 'Event planner');
    }

    booking.status = 'confirmed';
    booking.approvedAt = new Date();
    booking.rejectedAt = undefined;
    booking.rejectionReason = undefined;
    booking.payment.status = 'covered_by_subscription';
    booking.payment.coveredAt = new Date();
    booking.conversationId = await OrderChatService.activateConversationForBooking(booking);
    await booking.save();
    await booking.populate(this.bookingPartyPopulate as any);
    return this.serializeBookingDocument(booking);
  }

  static async reject(bookingId: string, providerId: string, role: 'venue_provider' | 'service_provider' | 'event_planner', reason?: string) {
    await this.ensureSubscribedUser(providerId, role);
    const booking = await this.findAccessibleBookingDocument(bookingId, providerId, role);
    if (getReferenceId(booking.providerId) !== providerId) {
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
    await booking.populate(this.bookingPartyPopulate as any);
    return this.serializeBookingDocument(booking);
  }

  static async cancel(bookingId: string, customerId: string) {
    const booking = await this.findAccessibleBookingDocument(bookingId, customerId, 'customer');
    if (getReferenceId(booking.customerId) !== customerId) {
      throw new AppError(403, 'Only the customer can cancel this booking');
    }

    if (booking.status === 'rejected' || booking.status === 'cancelled' || booking.status === 'completed') {
      throw new AppError(400, 'Booking cannot be cancelled');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    await booking.populate(this.bookingPartyPopulate as any);
    return this.serializeBookingDocument(booking);
  }

  static async complete(bookingId: string, customerId: string) {
    const booking = await this.findAccessibleBookingDocument(bookingId, customerId, 'customer');
    if (getReferenceId(booking.customerId) !== customerId) {
      throw new AppError(403, 'Only the customer can complete this booking');
    }

    if (booking.status !== 'confirmed') {
      throw new AppError(400, 'Only confirmed bookings can be completed');
    }

    if (isFutureBookingDate(booking.bookingDate)) {
      throw new AppError(400, 'Booking cannot be completed before the booking date');
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();
    await booking.populate(this.bookingPartyPopulate as any);
    return this.serializeBookingDocument(booking);
  }
}

import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import {
  ALL_BOOKING_HOURS,
  AvailabilityEntry,
  availabilityEntriesToCalendar,
  buildCalendarWindow,
  filterCalendarToWindow,
  removeAvailabilityEntryHours,
  upsertAvailabilityEntry
} from '../../common/utils/availability';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { hydrateUserSubscription, UserModel } from '../auth/auth.model';
import { BookingModel } from '../bookings/booking.model';
import { ReviewModel } from '../reviews/review.model';

const ensureObjectId = (value: string, label: string): void => {
  if (!isValidObjectId(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

const getCurrentMonthWindow = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const fromDate = new Date(Date.UTC(year, month, 1));
  const toDate = new Date(Date.UTC(year, month + 1, 0));

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    month: `${year}-${String(month + 1).padStart(2, '0')}`
  };
};

const getTodayUtcDate = () => new Date().toISOString().slice(0, 10);

export class EventPlannerService {
  private static normalizeEventPlannerProfileInfo(profileInfo?: Record<string, unknown> | null) {
    const verification =
      profileInfo?.verification && typeof profileInfo.verification === 'object'
        ? (profileInfo.verification as Record<string, unknown>)
        : null;

    return {
      nidOrTradeLicenseNumber: typeof profileInfo?.nidOrTradeLicenseNumber === 'string'
        ? profileInfo.nidOrTradeLicenseNumber
        : null,
      name: typeof profileInfo?.name === 'string' ? profileInfo.name : null,
      phoneNumber: typeof profileInfo?.phoneNumber === 'string' ? profileInfo.phoneNumber : null,
      description: typeof profileInfo?.description === 'string' ? profileInfo.description : null,
      coverageArea: Array.isArray(profileInfo?.coverageArea) ? profileInfo.coverageArea : null,
      address: typeof profileInfo?.address === 'string' ? profileInfo.address : null,
      hourlyRate: typeof profileInfo?.hourlyRate === 'number' ? profileInfo.hourlyRate : null,
      currency: typeof profileInfo?.currency === 'string' ? profileInfo.currency : null,
      verification: {
        businessType: typeof verification?.businessType === 'string' ? verification.businessType : null,
        companyName: typeof verification?.companyName === 'string' ? verification.companyName : null,
        nationalIdOrTradeLicenseFiles: Array.isArray(verification?.nationalIdOrTradeLicenseFiles)
          ? verification.nationalIdOrTradeLicenseFiles
          : null
      }
    };
  }

  private static normalizeEventPlannerOnboarding(onboarding?: Record<string, unknown> | null) {
    const verification =
      onboarding?.verification && typeof onboarding.verification === 'object'
        ? (onboarding.verification as Record<string, unknown>)
        : null;
    const eventProvider =
      onboarding?.eventProvider && typeof onboarding.eventProvider === 'object'
        ? (onboarding.eventProvider as Record<string, unknown>)
        : null;

    return {
      verification: {
        businessType: typeof verification?.businessType === 'string' ? verification.businessType : null,
        companyName: typeof verification?.companyName === 'string' ? verification.companyName : null,
        nationalIdOrTradeLicenseUrl:
          typeof verification?.nationalIdOrTradeLicenseUrl === 'string'
            ? verification.nationalIdOrTradeLicenseUrl
            : null
      },
      businessAddress: typeof onboarding?.businessAddress === 'string' ? onboarding.businessAddress : null,
      serviceProvider: null,
      eventProvider: {
        _id: typeof eventProvider?._id === 'string' ? eventProvider._id : null,
        fullName: typeof eventProvider?.fullName === 'string' ? eventProvider.fullName : null,
        email: typeof eventProvider?.email === 'string' ? eventProvider.email : null,
        profileInfo: this.normalizeEventPlannerProfileInfo(
          eventProvider?.profileInfo && typeof eventProvider.profileInfo === 'object'
            ? (eventProvider.profileInfo as Record<string, unknown>)
            : null
        )
      },
      venueProvider: null,
      submittedAt: onboarding?.submittedAt ?? null
    };
  }

  private static serializeEventPlanner<
    T extends {
      toObject?: () => Record<string, unknown>;
      profileImage?: unknown;
      coverImage?: unknown;
    }
  >(eventPlanner: T) {
    const plain =
      typeof eventPlanner?.toObject === 'function'
        ? eventPlanner.toObject()
        : ({ ...eventPlanner } as Record<string, unknown>);

    return {
      ...plain,
      profileImage:
        plain.profileImage &&
        typeof plain.profileImage === 'object' &&
        'url' in plain.profileImage
          ? plain.profileImage.url
          : null,
      coverImage:
        plain.coverImage &&
        typeof plain.coverImage === 'object' &&
        'url' in plain.coverImage
          ? plain.coverImage.url
          : null,
      onboarding: this.normalizeEventPlannerOnboarding(
        plain.onboarding && typeof plain.onboarding === 'object'
          ? (plain.onboarding as Record<string, unknown>)
          : null
      ),
      availability: availabilityEntriesToCalendar((plain.availabilityCalendar as AvailabilityEntry[] | undefined) ?? [])
    };
  }

  private static async ensureSubscribedEventPlanner(eventPlannerId: string) {
    const eventPlanner = await UserModel.findOne({
      _id: eventPlannerId,
      role: 'event_planner'
    });

    if (!eventPlanner) {
      throw new AppError(404, 'Event planner not found');
    }

    const hydratedSubscription = hydrateUserSubscription(eventPlanner.role, eventPlanner.subscription);
    if (JSON.stringify(eventPlanner.subscription) !== JSON.stringify(hydratedSubscription)) {
      eventPlanner.subscription = hydratedSubscription;
      await eventPlanner.save();
    }

    if (eventPlanner.subscription.status !== 'subscribed') {
      throw new AppError(403, 'A subscribed account is required for this action');
    }

    return eventPlanner;
  }

  static async getPublic(pagination: PaginationOptions) {
    const result = await paginateModel(
      UserModel,
      {
        role: 'event_planner',
        isEmailVerified: true,
        'onboarding.eventProvider': { $exists: true }
      },
      pagination
    );

    return {
      ...result,
      data: result.data.map((eventPlanner) => this.serializeEventPlanner(eventPlanner))
    };
  }

  static async getDashboardAnalytics(eventPlannerId: string) {
    ensureObjectId(eventPlannerId, 'eventPlannerId');

    const providerObjectId = new Types.ObjectId(eventPlannerId);
    const currentMonth = getCurrentMonthWindow();
    const today = getTodayUtcDate();

    const [totalEvents, upcomingBookings, revenueSummary, ratingSummary] = await Promise.all([
      BookingModel.countDocuments({
        providerId: eventPlannerId,
        targetType: 'event',
        status: { $in: ['pending', 'approved', 'confirmed', 'completed'] }
      }),
      BookingModel.countDocuments({
        providerId: eventPlannerId,
        targetType: 'event',
        status: { $in: ['pending', 'approved', 'confirmed'] },
        bookingDate: { $gte: today }
      }),
      BookingModel.aggregate([
        {
          $match: {
            providerId: providerObjectId,
            targetType: 'event',
            status: { $in: ['confirmed', 'completed'] },
            bookingDate: {
              $gte: currentMonth.from,
              $lte: currentMonth.to
            }
          }
        },
        {
          $group: {
            _id: '$pricing.currency',
            total: { $sum: '$pricing.totalAmount' }
          }
        },
        { $sort: { total: -1 } }
      ]),
      ReviewModel.aggregate([
        {
          $match: {
            providerId: providerObjectId,
            targetType: 'event'
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ]);

    const primaryRevenue = revenueSummary[0] ?? null;
    const rating = ratingSummary[0] ?? null;

    return {
      totalEvents,
      upcomingBookings,
      monthlyRevenue: primaryRevenue?.total ?? 0,
      currency: primaryRevenue?._id ?? 'BDT',
      averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0,
      totalReviews: rating?.totalReviews ?? 0,
      month: currentMonth.month
    };
  }

  static async getAll(pagination: PaginationOptions) {
    return this.getPublic(pagination);
  }

  static async getPublicById(eventPlannerId: string) {
    if (!isValidObjectId(eventPlannerId)) {
      throw new AppError(400, 'Invalid eventPlannerId');
    }

    const eventPlanner = await UserModel.findOne({
      _id: eventPlannerId,
      role: 'event_planner',
      isEmailVerified: true,
      'onboarding.eventProvider': { $exists: true }
    });

    if (!eventPlanner) {
      throw new AppError(404, 'Event planner not found');
    }

    return this.serializeEventPlanner(eventPlanner);
  }

  static async getAvailability(eventPlannerId: string, month?: string) {
    const eventPlanner = await UserModel.findOne({
      _id: eventPlannerId,
      role: 'event_planner'
    });

    if (!eventPlanner) {
      throw new AppError(404, 'Event planner not found');
    }

    const range = buildCalendarWindow(month);
    const manualCalendar = filterCalendarToWindow(
      availabilityEntriesToCalendar(eventPlanner.availabilityCalendar),
      range
    );
    const bookings = await BookingModel.find({
      targetType: 'event',
      targetId: eventPlannerId,
      status: 'confirmed',
      bookingDate: {
        $gte: range.from,
        $lte: range.to
      }
    }).select('bookingDate hours');

    const bookedCalendar: Record<string, number[]> = {};
    for (const booking of bookings) {
      bookedCalendar[booking.bookingDate] = [
        ...new Set([...(bookedCalendar[booking.bookingDate] ?? []), ...booking.hours])
      ].sort((left, right) => left - right);
    }

    return {
      range,
      availability: {
        ...manualCalendar,
        ...Object.fromEntries(
          Object.entries(bookedCalendar).map(([date, hours]) => [
            date,
            [...new Set([...(manualCalendar[date] ?? []), ...hours])].sort((left, right) => left - right)
          ])
        )
      }
    };
  }

  static async blockAvailability(eventPlannerId: string, date: string) {
    const eventPlanner = await this.ensureSubscribedEventPlanner(eventPlannerId);
    eventPlanner.availabilityCalendar = upsertAvailabilityEntry(
      eventPlanner.availabilityCalendar,
      date,
      ALL_BOOKING_HOURS
    );
    await eventPlanner.save();

    return {
      date,
      hours: availabilityEntriesToCalendar(eventPlanner.availabilityCalendar)[date] ?? []
    };
  }

  static async unblockAvailability(eventPlannerId: string, date: string) {
    const eventPlanner = await this.ensureSubscribedEventPlanner(eventPlannerId);
    eventPlanner.availabilityCalendar = removeAvailabilityEntryHours(
      eventPlanner.availabilityCalendar,
      date,
      ALL_BOOKING_HOURS
    );
    await eventPlanner.save();

    return {
      date,
      hours: availabilityEntriesToCalendar(eventPlanner.availabilityCalendar)[date] ?? []
    };
  }
}

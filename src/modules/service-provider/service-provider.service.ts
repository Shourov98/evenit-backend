import { isValidObjectId, Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import {
  ALL_BOOKING_HOURS,
  AvailabilityEntry,
  availabilityEntriesToCalendar,
  buildCalendarWindow,
  filterCalendarToWindow,
  normalizeAvailabilityEntries,
  removeAvailabilityEntryHours,
  upsertAvailabilityEntry
} from '../../common/utils/availability';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { buildPublicProviderInfo } from '../../common/utils/public-provider';
import { hydrateUserSubscription, UserModel } from '../auth/auth.model';
import { BookingModel } from '../bookings/booking.model';
import { NotificationService } from '../notifications/notification.service';
import { ReviewModel } from '../reviews/review.model';
import { ServiceDiscountType, ServiceProviderServiceModel } from './service-provider.model';

type CreateServicePayload = {
  information: {
    serviceName: string;
    category: string;
    description?: string;
    serviceArea: string[];
    tags: string[];
  };
  pricing: {
    amount: number;
    pricingType: 'hourly';
    currency: string;
    discount?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
  };
  settings: {
    amenities: Record<string, boolean>;
    capacity?: number;
  };
  media: {
    galleryImages: string[];
    videoUrl?: string;
  };
  availabilityCalendar: AvailabilityEntry[];
};

type UpdateServicePayload = Partial<CreateServicePayload>;
type UpdateServicePatchPayload = Omit<UpdateServicePayload, 'pricing' | 'media' | 'settings'> & {
  pricing?: Partial<CreateServicePayload['pricing']> & {
    discount?: CreateServicePayload['pricing']['discount'] | null;
  };
  settings?: Partial<CreateServicePayload['settings']> & {
    capacity?: number | null;
  };
  media?: Partial<CreateServicePayload['media']> & {
    videoUrl?: string | null;
  };
};

const ensureObjectId = (id: string, label: string): void => {
  if (!isValidObjectId(id)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

const normalizeCurrency = <
  T extends {
    pricing?: {
      currency?: string;
      pricingType?: string;
    };
  }
>(
  payload: T
) => {
  if (payload.pricing) {
    payload.pricing.pricingType = 'hourly';
  }

  if (payload.pricing?.currency) {
    payload.pricing.currency = payload.pricing.currency.toUpperCase();
  }
  return payload;
};

const hasReviewableServiceChanges = (payload: UpdateServicePatchPayload) =>
  Boolean(payload.information || payload.pricing || payload.settings || payload.media);

const toComparable = (value: unknown): unknown => {
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, nestedValue]) => [key, toComparable(nestedValue)])
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => toComparable(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, toComparable(nestedValue)])
    );
  }

  return value;
};

const areEqual = (left: unknown, right: unknown) =>
  JSON.stringify(toComparable(left)) === JSON.stringify(toComparable(right));

const sanitizeServicePricing = <
  T extends {
    discount?: {
      type: ServiceDiscountType;
      value: number;
    };
  }
>(
  pricing: T
) => {
  const nextPricing = {
    ...pricing
  };

  if (!nextPricing.discount) {
    delete nextPricing.discount;
  }

  return nextPricing;
};

const serializeService = <T extends { toObject?: () => Record<string, unknown>; ownerId?: unknown }>(
  service: T
) => {
  const plain =
    typeof service?.toObject === 'function'
      ? service.toObject()
      : ({ ...service } as Record<string, unknown>);

  return {
    ...plain,
    availability: availabilityEntriesToCalendar((plain.availabilityCalendar as AvailabilityEntry[] | undefined) ?? [])
  };
};

const buildConfirmedBookingCalendar = async (serviceId: string, range: { from: string; to: string }) => {
  const bookings = await BookingModel.find({
    targetType: 'service',
    targetId: serviceId,
    status: 'confirmed',
    bookingDate: {
      $gte: range.from,
      $lte: range.to
    }
  }).select('bookingDate hours');

  const calendar: Record<string, number[]> = {};
  for (const booking of bookings) {
    calendar[booking.bookingDate] = [...new Set([...(calendar[booking.bookingDate] ?? []), ...booking.hours])].sort(
      (left, right) => left - right
    );
  }

  return calendar;
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

export class ServiceProviderService {
  private static async ensureSubscribedServiceProvider(ownerId: string) {
    const owner = await UserModel.findById(ownerId);

    if (!owner || owner.role !== 'service_provider') {
      throw new AppError(403, 'Only service providers can manage services');
    }

    const hydratedSubscription = hydrateUserSubscription(owner.role, owner.subscription);
    if (JSON.stringify(owner.subscription) !== JSON.stringify(hydratedSubscription)) {
      owner.subscription = hydratedSubscription;
      await owner.save();
    }

    if (owner.subscription.status !== 'subscribed') {
      throw new AppError(403, 'A subscribed account is required for this action');
    }

    return owner;
  }

  static async create(ownerId: string, payload: CreateServicePayload) {
    ensureObjectId(ownerId, 'ownerId');
    const owner = await this.ensureSubscribedServiceProvider(ownerId);

    const service = await ServiceProviderServiceModel.create({
      ownerId,
      ...normalizeCurrency(payload),
      availabilityCalendar: normalizeAvailabilityEntries(payload.availabilityCalendar ?? []),
      publishStatus: 'pending',
      approvedBy: undefined,
      approvedAt: undefined
    });

    await NotificationService.notifyAdminsOfNewServiceRequest({
      serviceId: String(service._id),
      serviceName: service.information.serviceName,
      ownerId,
      ownerName: owner.fullName
    });

    return serializeService(service);
  }

  static async getMine(
    ownerId: string,
    pagination: PaginationOptions,
    filters?: {
      publishStatus?: 'pending' | 'published' | 'rejected';
    }
  ) {
    ensureObjectId(ownerId, 'ownerId');

    const services = await paginateModel(
      ServiceProviderServiceModel,
      {
        ownerId,
        isDeleted: false,
        ...(filters?.publishStatus ? { publishStatus: filters.publishStatus } : {})
      },
      pagination
    );

    return {
      ...services,
      data: services.data.map((service) => serializeService(service))
    };
  }

  static async getDashboardAnalytics(ownerId: string) {
    ensureObjectId(ownerId, 'ownerId');

    const providerObjectId = new Types.ObjectId(ownerId);
    const currentMonth = getCurrentMonthWindow();
    const today = getTodayUtcDate();

    const [totalServices, upcomingBookings, revenueSummary, ratingSummary] = await Promise.all([
      ServiceProviderServiceModel.countDocuments({
        ownerId,
        isDeleted: false
      }),
      BookingModel.countDocuments({
        providerId: ownerId,
        targetType: 'service',
        status: { $in: ['pending', 'approved', 'confirmed'] },
        bookingDate: { $gte: today }
      }),
      BookingModel.aggregate([
        {
          $match: {
            providerId: providerObjectId,
            targetType: 'service',
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
            targetType: 'service'
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
      totalServices,
      upcomingBookings,
      monthlyRevenue: primaryRevenue?.total ?? 0,
      currency: primaryRevenue?._id ?? 'BDT',
      averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0,
      totalReviews: rating?.totalReviews ?? 0,
      month: currentMonth.month
    };
  }

  static async getPublic(pagination: PaginationOptions) {
    const services = await paginateModel(
      ServiceProviderServiceModel,
      {
        isDeleted: false,
        publishStatus: 'published'
      },
      pagination
    );

    const hydratedServices = await ServiceProviderServiceModel.populate(services.data, {
      path: 'ownerId',
      model: UserModel,
      select: 'fullName role onboarding.serviceProvider'
    });

    return {
      ...services,
      data: hydratedServices.map((service) => ({
        ...serializeService(service),
        provider: buildPublicProviderInfo(service.ownerId as never)
      }))
    };
  }

  static async getPublicById(serviceId: string) {
    ensureObjectId(serviceId, 'serviceId');

    const service = await ServiceProviderServiceModel.findOne({
      _id: serviceId,
      isDeleted: false,
      publishStatus: 'published'
    }).populate({
      path: 'ownerId',
      model: UserModel,
      select: 'fullName role onboarding.serviceProvider'
    });

    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    return {
      ...serializeService(service),
      provider: buildPublicProviderInfo(service.ownerId as never)
    };
  }

  static async getById(ownerId: string, serviceId: string) {
    ensureObjectId(ownerId, 'ownerId');
    ensureObjectId(serviceId, 'serviceId');

    const service = await ServiceProviderServiceModel.findOne({
      _id: serviceId,
      ownerId,
      isDeleted: false
    });

    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    return service;
  }

  static async update(ownerId: string, serviceId: string, payload: UpdateServicePatchPayload) {
    await this.ensureSubscribedServiceProvider(ownerId);
    const service = await this.getById(ownerId, serviceId);
    const normalizedPayload = normalizeCurrency(payload);
    const nextInformation = normalizedPayload.information
      ? {
          ...service.information,
          ...normalizedPayload.information
        }
      : service.information;
    const nextPricing = normalizedPayload.pricing
      ? {
          ...service.pricing,
          ...normalizedPayload.pricing
        }
      : service.pricing;
    const nextSettings = normalizedPayload.settings
      ? {
          ...service.settings,
          ...normalizedPayload.settings
        }
      : service.settings;
    const nextMedia = normalizedPayload.media
      ? {
          ...service.media,
          ...normalizedPayload.media
        }
      : service.media;

    if (normalizedPayload.pricing?.discount === null) {
      nextPricing.discount = undefined;
    }

    if (normalizedPayload.settings?.capacity === null) {
      nextSettings.capacity = undefined;
    }

    if (normalizedPayload.media?.videoUrl === null) {
      nextMedia.videoUrl = undefined;
    }

    if (normalizedPayload.information) {
      service.information = nextInformation;
    }

    if (normalizedPayload.pricing) {
      service.pricing = sanitizeServicePricing(nextPricing);
    }

    if (normalizedPayload.settings) {
      service.settings = {
        ...nextSettings
      };
    }

    if (normalizedPayload.media) {
      service.media = {
        ...nextMedia
      };
    }

    if (normalizedPayload.availabilityCalendar) {
      service.availabilityCalendar = normalizeAvailabilityEntries(normalizedPayload.availabilityCalendar);
    }

    await service.save();
    return serializeService(service);
  }

  static async getAvailability(ownerId: string, serviceId: string, month?: string) {
    const service = await this.getById(ownerId, serviceId);
    const range = buildCalendarWindow(month);
    const manualCalendar = filterCalendarToWindow(
      availabilityEntriesToCalendar(service.availabilityCalendar),
      range
    );
    const bookingCalendar = await buildConfirmedBookingCalendar(serviceId, range);

    return {
      range,
      availability: {
        ...manualCalendar,
        ...Object.fromEntries(
          Object.entries(bookingCalendar).map(([date, hours]) => [
            date,
            [...new Set([...(manualCalendar[date] ?? []), ...hours])].sort((left, right) => left - right)
          ])
        )
      }
    };
  }

  static async blockAvailability(ownerId: string, serviceId: string, date: string) {
    await this.ensureSubscribedServiceProvider(ownerId);
    const service = await this.getById(ownerId, serviceId);
    service.availabilityCalendar = upsertAvailabilityEntry(
      service.availabilityCalendar,
      date,
      ALL_BOOKING_HOURS
    );
    await service.save();

    return {
      date,
      hours: availabilityEntriesToCalendar(service.availabilityCalendar)[date] ?? []
    };
  }

  static async unblockAvailability(ownerId: string, serviceId: string, date: string) {
    await this.ensureSubscribedServiceProvider(ownerId);
    const service = await this.getById(ownerId, serviceId);
    service.availabilityCalendar = removeAvailabilityEntryHours(
      service.availabilityCalendar,
      date,
      ALL_BOOKING_HOURS
    );
    await service.save();

    return {
      date,
      hours: availabilityEntriesToCalendar(service.availabilityCalendar)[date] ?? []
    };
  }

  static async delete(ownerId: string, serviceId: string) {
    const service = await this.getById(ownerId, serviceId);
    service.isDeleted = true;
    await service.save();
  }
}

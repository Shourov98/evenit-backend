import { isValidObjectId } from 'mongoose';
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
import { normalizeVenueAmenities, VenueProviderVenueModel } from './venue-provider.model';

type CreateVenuePayload = {
  information: {
    venueName: string;
    venueType: string;
    description?: string;
    addressLine: string;
    city: string;
    area?: string;
  };
  pricing: {
    basePrice?: number;
    pricePerPerson?: number;
    currency: string;
    discount?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
    amenities: Record<string, boolean>;
  };
  capacity: {
    maximumGuests: number;
  };
  media: {
    galleryImages: string[];
    videoUrl?: string;
  };
  availabilityCalendar: AvailabilityEntry[];
};

type UpdateVenuePayload = Partial<CreateVenuePayload>;
type UpdateVenuePatchPayload = Omit<UpdateVenuePayload, 'pricing' | 'media'> & {
  pricing?: Partial<CreateVenuePayload['pricing']> & {
    discount?: CreateVenuePayload['pricing']['discount'] | null;
  };
  media?: Partial<CreateVenuePayload['media']> & {
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
      basePrice?: number;
      pricePerPerson?: number;
      currency?: string;
      amenities?: Record<string, boolean>;
    };
  }
>(
  payload: T
) => {
  if (payload.pricing) {
    if (typeof payload.pricing.pricePerPerson === 'number') {
      payload.pricing.basePrice = payload.pricing.pricePerPerson;
    } else if (typeof payload.pricing.basePrice === 'number') {
      payload.pricing.pricePerPerson = payload.pricing.basePrice;
    }
  }

  if (payload.pricing?.currency) {
    payload.pricing.currency = payload.pricing.currency.toUpperCase();
  }

  if (payload.pricing) {
    payload.pricing.amenities = normalizeVenueAmenities(payload.pricing.amenities);
  }

  return payload;
};

const serializeVenue = <T extends { toObject?: () => Record<string, unknown>; ownerId?: unknown }>(
  venue: T
) => {
  const plain =
    typeof venue?.toObject === 'function'
      ? (venue as any).toObject({ flattenMaps: true })
      : ({ ...venue } as Record<string, unknown>);

  return {
    ...plain,
    pricing: {
      ...(plain.pricing as Record<string, unknown>),
      pricePerPerson:
        Number((plain.pricing as Record<string, unknown> | undefined)?.basePrice ?? 0) || 0,
      pricingModel: 'per_person',
      amenities: normalizeVenueAmenities((plain.pricing as Record<string, any> | undefined)?.amenities)
    },
    availability: availabilityEntriesToCalendar((plain.availabilityCalendar as AvailabilityEntry[] | undefined) ?? [])
  };
};

const buildConfirmedBookingCalendar = async (venueId: string, range: { from: string; to: string }) => {
  const bookings = await BookingModel.find({
    targetType: 'venue',
    targetId: venueId,
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

export class VenueProviderService {
  private static async ensureSubscribedVenueProvider(ownerId: string) {
    const owner = await UserModel.findById(ownerId);

    if (!owner || owner.role !== 'venue_provider') {
      throw new AppError(403, 'Only venue providers can manage venues');
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

  static async create(ownerId: string, payload: CreateVenuePayload) {
    ensureObjectId(ownerId, 'ownerId');
    const owner = await this.ensureSubscribedVenueProvider(ownerId);

    const result = await VenueProviderVenueModel.create({
      ownerId,
      ...normalizeCurrency(payload),
      availabilityCalendar: normalizeAvailabilityEntries(payload.availabilityCalendar ?? []),
      publishStatus: 'pending',
      approvedBy: undefined,
      approvedAt: undefined
    });

    await NotificationService.notifyAdminsOfNewVenueRequest({
      venueId: String(result._id),
      venueName: result.information.venueName,
      ownerId,
      ownerName: owner.fullName
    });

    return serializeVenue(result);
  }

  static async getMine(
    ownerId: string,
    pagination: PaginationOptions,
    filters?: {
      publishStatus?: 'pending' | 'published' | 'rejected';
    }
  ) {
    ensureObjectId(ownerId, 'ownerId');

    const venues = await paginateModel(
      VenueProviderVenueModel,
      {
        ownerId,
        isDeleted: false,
        ...(filters?.publishStatus ? { publishStatus: filters.publishStatus } : {})
      },
      pagination
    );

    return {
      ...venues,
      data: venues.data.map((venue) => serializeVenue(venue))
    };
  }

  static async getPublic(pagination: PaginationOptions) {
    const venues = await paginateModel(
      VenueProviderVenueModel,
      {
        isDeleted: false,
        publishStatus: 'published'
      },
      pagination
    );

    const hydratedVenues = await VenueProviderVenueModel.populate(venues.data, {
      path: 'ownerId',
      model: UserModel,
      select: 'fullName role onboarding.venueProvider'
    });

    return {
      ...venues,
      data: hydratedVenues.map((venue) => ({
        ...serializeVenue(venue),
        provider: buildPublicProviderInfo(venue.ownerId as never)
      }))
    };
  }

  static async getPublicById(venueId: string) {
    ensureObjectId(venueId, 'venueId');

    const venue = await VenueProviderVenueModel.findOne({
      _id: venueId,
      isDeleted: false,
      publishStatus: 'published'
    }).populate({
      path: 'ownerId',
      model: UserModel,
      select: 'fullName role onboarding.venueProvider'
    });

    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    return {
      ...serializeVenue(venue),
      provider: buildPublicProviderInfo(venue.ownerId as never)
    };
  }

  static async getById(ownerId: string, venueId: string) {
    ensureObjectId(ownerId, 'ownerId');
    ensureObjectId(venueId, 'venueId');

    const venue = await VenueProviderVenueModel.findOne({
      _id: venueId,
      ownerId,
      isDeleted: false
    });

    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    return venue;
  }

  static async update(ownerId: string, venueId: string, payload: UpdateVenuePatchPayload) {
    await this.ensureSubscribedVenueProvider(ownerId);
    const venue = await this.getById(ownerId, venueId);
    const normalizedPayload = normalizeCurrency(payload);

    if (normalizedPayload.information) {
      venue.information = {
        ...venue.information,
        ...normalizedPayload.information
      };
    }

    if (normalizedPayload.pricing) {
      const nextPricing = {
        ...venue.pricing,
        ...normalizedPayload.pricing
      };

      if (normalizedPayload.pricing.discount === null) {
        nextPricing.discount = undefined;
      }

      venue.pricing = {
        ...nextPricing
      };
    }

    if (normalizedPayload.capacity) {
      venue.capacity = {
        ...venue.capacity,
        ...normalizedPayload.capacity
      };
    }

    if (normalizedPayload.media) {
      const nextMedia = {
        ...venue.media,
        ...normalizedPayload.media
      };

      if (normalizedPayload.media.videoUrl === null) {
        nextMedia.videoUrl = undefined;
      }

      venue.media = {
        ...nextMedia
      };
    }

    if (normalizedPayload.availabilityCalendar) {
      venue.availabilityCalendar = normalizeAvailabilityEntries(normalizedPayload.availabilityCalendar);
    }

    venue.publishStatus = 'pending';
    venue.approvedBy = undefined;
    venue.approvedAt = undefined;

    await venue.save();
    return serializeVenue(venue);
  }

  static async getAvailability(ownerId: string, venueId: string, month?: string) {
    const venue = await this.getById(ownerId, venueId);
    const range = buildCalendarWindow(month);
    const manualCalendar = filterCalendarToWindow(
      availabilityEntriesToCalendar(venue.availabilityCalendar),
      range
    );
    const bookingCalendar = await buildConfirmedBookingCalendar(venueId, range);

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

  static async blockAvailability(ownerId: string, venueId: string, date: string) {
    await this.ensureSubscribedVenueProvider(ownerId);
    const venue = await this.getById(ownerId, venueId);
    venue.availabilityCalendar = upsertAvailabilityEntry(
      venue.availabilityCalendar,
      date,
      ALL_BOOKING_HOURS
    );
    await venue.save();

    return {
      date,
      hours: availabilityEntriesToCalendar(venue.availabilityCalendar)[date] ?? []
    };
  }

  static async unblockAvailability(ownerId: string, venueId: string, date: string) {
    await this.ensureSubscribedVenueProvider(ownerId);
    const venue = await this.getById(ownerId, venueId);
    venue.availabilityCalendar = removeAvailabilityEntryHours(
      venue.availabilityCalendar,
      date,
      ALL_BOOKING_HOURS
    );
    await venue.save();

    return {
      date,
      hours: availabilityEntriesToCalendar(venue.availabilityCalendar)[date] ?? []
    };
  }

  static async delete(ownerId: string, venueId: string) {
    const venue = await this.getById(ownerId, venueId);
    venue.isDeleted = true;
    await venue.save();
  }
}

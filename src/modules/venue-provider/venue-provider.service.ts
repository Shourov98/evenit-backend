import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { VenueProviderVenueModel } from './venue-provider.model';

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
    basePrice: number;
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
  availabilityOverrides: Array<{
    date: string;
    status: 'available' | 'pending' | 'booked';
  }>;
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
      currency?: string;
    };
  }
>(
  payload: T
) => {
  if (payload.pricing?.currency) {
    payload.pricing.currency = payload.pricing.currency.toUpperCase();
  }
  return payload;
};

export class VenueProviderService {
  static async create(ownerId: string, payload: CreateVenuePayload) {
    ensureObjectId(ownerId, 'ownerId');

    const result = await VenueProviderVenueModel.create({
      ownerId,
      ...normalizeCurrency(payload)
    });

    return result;
  }

  static async getMine(ownerId: string) {
    ensureObjectId(ownerId, 'ownerId');

    return VenueProviderVenueModel.find({
      ownerId,
      isDeleted: false
    }).sort({ createdAt: -1 });
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

    if (normalizedPayload.availabilityOverrides) {
      venue.availabilityOverrides = normalizedPayload.availabilityOverrides;
    }

    await venue.save();
    return venue;
  }

  static async delete(ownerId: string, venueId: string) {
    const venue = await this.getById(ownerId, venueId);
    venue.isDeleted = true;
    await venue.save();
  }
}

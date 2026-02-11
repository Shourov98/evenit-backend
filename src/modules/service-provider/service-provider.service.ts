import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { ServiceProviderServiceModel } from './service-provider.model';

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
    pricingType: 'fixed' | 'hourly' | 'daily' | 'package';
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
  availabilityOverrides: Array<{
    date: string;
    status: 'available' | 'pending' | 'booked';
  }>;
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

export class ServiceProviderService {
  static async create(ownerId: string, payload: CreateServicePayload) {
    ensureObjectId(ownerId, 'ownerId');

    return ServiceProviderServiceModel.create({
      ownerId,
      ...normalizeCurrency(payload),
      publishStatus: 'pending',
      approvedBy: undefined,
      approvedAt: undefined
    });
  }

  static async getMine(ownerId: string, pagination: PaginationOptions) {
    ensureObjectId(ownerId, 'ownerId');

    return paginateModel(
      ServiceProviderServiceModel,
      {
        ownerId,
        isDeleted: false
      },
      pagination
    );
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
    const service = await this.getById(ownerId, serviceId);
    const normalizedPayload = normalizeCurrency(payload);

    if (normalizedPayload.information) {
      service.information = {
        ...service.information,
        ...normalizedPayload.information
      };
    }

    if (normalizedPayload.pricing) {
      const nextPricing = {
        ...service.pricing,
        ...normalizedPayload.pricing
      };

      if (normalizedPayload.pricing.discount === null) {
        nextPricing.discount = undefined;
      }

      service.pricing = {
        ...nextPricing
      };
    }

    if (normalizedPayload.settings) {
      const nextSettings = {
        ...service.settings,
        ...normalizedPayload.settings
      };

      if (normalizedPayload.settings.capacity === null) {
        nextSettings.capacity = undefined;
      }

      service.settings = {
        ...nextSettings
      };
    }

    if (normalizedPayload.media) {
      const nextMedia = {
        ...service.media,
        ...normalizedPayload.media
      };

      if (normalizedPayload.media.videoUrl === null) {
        nextMedia.videoUrl = undefined;
      }

      service.media = {
        ...nextMedia
      };
    }

    if (normalizedPayload.availabilityOverrides) {
      service.availabilityOverrides = normalizedPayload.availabilityOverrides;
    }

    service.publishStatus = 'pending';
    service.approvedBy = undefined;
    service.approvedAt = undefined;

    await service.save();
    return service;
  }

  static async delete(ownerId: string, serviceId: string) {
    const service = await this.getById(ownerId, serviceId);
    service.isDeleted = true;
    await service.save();
  }
}

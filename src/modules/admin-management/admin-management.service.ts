import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { AppError } from '../../common/errors/AppError';
import { createDefaultUserSubscription, UserModel } from '../auth/auth.model';
import { ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { VenueProviderVenueModel } from '../venue-provider/venue-provider.model';

interface ApproverInfo {
  name: string;
  email: string;
}

export class AdminManagementService {
  static async createAdmin(payload: { fullName: string; email: string; password: string }) {
    const existing = await UserModel.findOne({ email: payload.email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'Email already in use');
    }

    return UserModel.create({
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      password: payload.password,
      role: 'admin',
      serviceCategories: [],
      isEmailVerified: true,
      isBlocked: false,
      subscription: createDefaultUserSubscription('admin')
    });
  }

  static async blockAdmin(adminUserId: string) {
    const admin = await UserModel.findOne({ _id: adminUserId, role: 'admin' });
    if (!admin) {
      throw new AppError(404, 'Admin not found');
    }

    admin.isBlocked = true;
    await admin.save();
    return admin;
  }

  static async unblockAdmin(adminUserId: string) {
    const admin = await UserModel.findOne({ _id: adminUserId, role: 'admin' });
    if (!admin) {
      throw new AppError(404, 'Admin not found');
    }

    admin.isBlocked = false;
    await admin.save();
    return admin;
  }

  static async getAllVenues(pagination: PaginationOptions) {
    return paginateModel(
      VenueProviderVenueModel,
      {
        isDeleted: false
      },
      pagination
    );
  }

  static async getAllServices(pagination: PaginationOptions) {
    return paginateModel(
      ServiceProviderServiceModel,
      {
        isDeleted: false
      },
      pagination
    );
  }

  static async getPendingVenues(pagination: PaginationOptions) {
    return paginateModel(
      VenueProviderVenueModel,
      {
        isDeleted: false,
        publishStatus: 'pending'
      },
      pagination
    );
  }

  static async getPendingServices(pagination: PaginationOptions) {
    return paginateModel(
      ServiceProviderServiceModel,
      {
        isDeleted: false,
        publishStatus: 'pending'
      },
      pagination
    );
  }

  static async approveVenue(venueId: string, approver: ApproverInfo) {
    const venue = await VenueProviderVenueModel.findOne({ _id: venueId, isDeleted: false });
    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    venue.publishStatus = 'published';
    venue.approvedBy = approver;
    venue.approvedAt = new Date();
    await venue.save();

    return venue;
  }

  static async rejectVenue(venueId: string) {
    const venue = await VenueProviderVenueModel.findOne({ _id: venueId, isDeleted: false });
    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    venue.publishStatus = 'rejected';
    venue.approvedBy = undefined;
    venue.approvedAt = undefined;
    await venue.save();

    return venue;
  }

  static async approveService(serviceId: string, approver: ApproverInfo) {
    const service = await ServiceProviderServiceModel.findOne({ _id: serviceId, isDeleted: false });
    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    service.publishStatus = 'published';
    service.approvedBy = approver;
    service.approvedAt = new Date();
    await service.save();

    return service;
  }

  static async rejectService(serviceId: string) {
    const service = await ServiceProviderServiceModel.findOne({ _id: serviceId, isDeleted: false });
    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    service.publishStatus = 'rejected';
    service.approvedBy = undefined;
    service.approvedAt = undefined;
    await service.save();

    return service;
  }
}

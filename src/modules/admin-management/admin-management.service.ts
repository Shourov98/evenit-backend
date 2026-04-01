import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { AppError } from '../../common/errors/AppError';
import { buildAdminOwnerInfo } from '../../common/utils/public-provider';
import { createDefaultUserSubscription, UserModel, UserRole } from '../auth/auth.model';
import { ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { VenueProviderVenueModel } from '../venue-provider/venue-provider.model';

interface ApproverInfo {
  name: string;
  email: string;
}

const ADMIN_OWNER_SELECT =
  'fullName email role isEmailVerified isBlocked profileImage onboarding.serviceProvider onboarding.venueProvider';
const ADMIN_MANAGED_USER_SELECT =
  'fullName email role serviceCategories isEmailVerified isBlocked profileImage subscription onboarding createdAt updatedAt';

const attachOwners = async <
  TDoc extends {
    ownerId: unknown;
    toObject(): Record<string, unknown>;
  }
>(
  model: typeof VenueProviderVenueModel | typeof ServiceProviderServiceModel,
  items: TDoc[]
) => {
  const populatedItems = await model.populate(items, {
    path: 'ownerId',
    model: UserModel,
    select: ADMIN_OWNER_SELECT
  });

  return populatedItems.map((item) => {
    const itemObject = item.toObject();

    return {
      ...itemObject,
      owner: buildAdminOwnerInfo(item.ownerId as never)
    };
  });
};

const attachOwner = async <
  TDoc extends {
    ownerId: unknown;
    toObject(): Record<string, unknown>;
  }
>(
  model: typeof VenueProviderVenueModel | typeof ServiceProviderServiceModel,
  item: TDoc
) => {
  const [populatedItem] = await attachOwners(model, [item]);
  return populatedItem;
};

export class AdminManagementService {
  private static async getUsersByRole(
    role: Extract<UserRole, 'customer' | 'service_provider' | 'venue_provider' | 'event_planner'>,
    pagination: PaginationOptions,
    extraFilter: Record<string, unknown> = {}
  ) {
    return paginateModel(
      UserModel,
      {
        role,
        ...extraFilter
      },
      pagination
    );
  }

  private static async getUserByRole(
    userId: string,
    role: Extract<UserRole, 'customer' | 'service_provider' | 'venue_provider' | 'event_planner'>,
    label: string
  ) {
    const user = await UserModel.findOne({ _id: userId, role }).select(ADMIN_MANAGED_USER_SELECT);

    if (!user) {
      throw new AppError(404, `${label} not found`);
    }

    return user;
  }

  private static async setUserBlockedState(
    userId: string,
    role: Extract<UserRole, 'customer' | 'service_provider' | 'venue_provider' | 'event_planner'>,
    label: string,
    isBlocked: boolean
  ) {
    const user = await this.getUserByRole(userId, role, label);
    user.isBlocked = isBlocked;
    await user.save();
    return user;
  }

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

  static async getCustomers(pagination: PaginationOptions) {
    return this.getUsersByRole('customer', pagination);
  }

  static async getBlockedCustomers(pagination: PaginationOptions) {
    return this.getUsersByRole('customer', pagination, { isBlocked: true });
  }

  static async getCustomerById(customerId: string) {
    return this.getUserByRole(customerId, 'customer', 'Customer');
  }

  static async blockCustomer(customerId: string) {
    return this.setUserBlockedState(customerId, 'customer', 'Customer', true);
  }

  static async unblockCustomer(customerId: string) {
    return this.setUserBlockedState(customerId, 'customer', 'Customer', false);
  }

  static async getServiceProviders(pagination: PaginationOptions) {
    return this.getUsersByRole('service_provider', pagination);
  }

  static async getBlockedServiceProviders(pagination: PaginationOptions) {
    return this.getUsersByRole('service_provider', pagination, { isBlocked: true });
  }

  static async getServiceProviderById(serviceProviderId: string) {
    return this.getUserByRole(serviceProviderId, 'service_provider', 'Service provider');
  }

  static async blockServiceProvider(serviceProviderId: string) {
    return this.setUserBlockedState(serviceProviderId, 'service_provider', 'Service provider', true);
  }

  static async unblockServiceProvider(serviceProviderId: string) {
    return this.setUserBlockedState(serviceProviderId, 'service_provider', 'Service provider', false);
  }

  static async getVenueProviders(pagination: PaginationOptions) {
    return this.getUsersByRole('venue_provider', pagination);
  }

  static async getBlockedVenueProviders(pagination: PaginationOptions) {
    return this.getUsersByRole('venue_provider', pagination, { isBlocked: true });
  }

  static async getVenueProviderById(venueProviderId: string) {
    return this.getUserByRole(venueProviderId, 'venue_provider', 'Venue provider');
  }

  static async blockVenueProvider(venueProviderId: string) {
    return this.setUserBlockedState(venueProviderId, 'venue_provider', 'Venue provider', true);
  }

  static async unblockVenueProvider(venueProviderId: string) {
    return this.setUserBlockedState(venueProviderId, 'venue_provider', 'Venue provider', false);
  }

  static async getEventPlanners(pagination: PaginationOptions) {
    return this.getUsersByRole('event_planner', pagination);
  }

  static async getBlockedEventPlanners(pagination: PaginationOptions) {
    return this.getUsersByRole('event_planner', pagination, { isBlocked: true });
  }

  static async getEventPlannerById(eventPlannerId: string) {
    return this.getUserByRole(eventPlannerId, 'event_planner', 'Event planner');
  }

  static async blockEventPlanner(eventPlannerId: string) {
    return this.setUserBlockedState(eventPlannerId, 'event_planner', 'Event planner', true);
  }

  static async unblockEventPlanner(eventPlannerId: string) {
    return this.setUserBlockedState(eventPlannerId, 'event_planner', 'Event planner', false);
  }

  static async getAllVenues(pagination: PaginationOptions) {
    const venues = await paginateModel(
      VenueProviderVenueModel,
      {
        isDeleted: false
      },
      pagination
    );

    return {
      ...venues,
      data: await attachOwners(VenueProviderVenueModel, venues.data)
    };
  }

  static async getAllServices(pagination: PaginationOptions) {
    const services = await paginateModel(
      ServiceProviderServiceModel,
      {
        isDeleted: false
      },
      pagination
    );

    return {
      ...services,
      data: await attachOwners(ServiceProviderServiceModel, services.data)
    };
  }

  static async getPendingVenues(pagination: PaginationOptions) {
    const venues = await paginateModel(
      VenueProviderVenueModel,
      {
        isDeleted: false,
        publishStatus: 'pending'
      },
      pagination
    );

    return {
      ...venues,
      data: await attachOwners(VenueProviderVenueModel, venues.data)
    };
  }

  static async getPendingServices(pagination: PaginationOptions) {
    const services = await paginateModel(
      ServiceProviderServiceModel,
      {
        isDeleted: false,
        publishStatus: 'pending'
      },
      pagination
    );

    return {
      ...services,
      data: await attachOwners(ServiceProviderServiceModel, services.data)
    };
  }

  static async getVenueById(venueId: string) {
    const venue = await VenueProviderVenueModel.findOne({ _id: venueId, isDeleted: false });
    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    return attachOwner(VenueProviderVenueModel, venue);
  }

  static async getServiceById(serviceId: string) {
    const service = await ServiceProviderServiceModel.findOne({ _id: serviceId, isDeleted: false });
    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    return attachOwner(ServiceProviderServiceModel, service);
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

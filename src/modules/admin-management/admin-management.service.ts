import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { AppError } from '../../common/errors/AppError';
import { buildAdminOwnerInfo } from '../../common/utils/public-provider';
import { createDefaultUserSubscription, UserModel, UserRole } from '../auth/auth.model';
import { BookingModel } from '../bookings/booking.model';
import { NotificationService } from '../notifications/notification.service';
import { ServiceProviderServiceModel } from '../service-provider/service-provider.model';
import { normalizeVenueAmenities, VenueProviderVenueModel } from '../venue-provider/venue-provider.model';

interface ApproverInfo {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

const ADMIN_OWNER_SELECT =
  'fullName email role isEmailVerified isBlocked profileImage onboarding.serviceProvider onboarding.venueProvider';
const ADMIN_MANAGED_USER_SELECT =
  'fullName email role serviceCategories isEmailVerified isBlocked profileImage subscription onboarding createdAt updatedAt';
const analyticsUserRoles = ['customer', 'event_planner', 'service_provider', 'venue_provider'] as const;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getMonthRangeUtc = (year: number, month: number) => {
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

  return { start, end };
};

const getCurrentMonthRangeUtc = () => {
  const now = new Date();
  return getMonthRangeUtc(now.getUTCFullYear(), now.getUTCMonth());
};

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
    const itemObject = item.toObject({ flattenMaps: true });

    if (model === VenueProviderVenueModel && itemObject.pricing && typeof itemObject.pricing === 'object') {
      itemObject.pricing = {
        ...itemObject.pricing,
        amenities: normalizeVenueAmenities((itemObject.pricing as Record<string, any>).amenities)
      };
    }

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
    await NotificationService.notifyVenueDecision({
      venueId: String(venue._id),
      venueName: venue.information.venueName,
      ownerId: String(venue.ownerId),
      decision: 'approved',
      actorId: approver.userId,
      actorName: approver.name,
      actorRole: approver.role
    });

    return venue;
  }

  static async rejectVenue(venueId: string, approver: ApproverInfo) {
    const venue = await VenueProviderVenueModel.findOne({ _id: venueId, isDeleted: false });
    if (!venue) {
      throw new AppError(404, 'Venue not found');
    }

    venue.publishStatus = 'rejected';
    venue.approvedBy = undefined;
    venue.approvedAt = undefined;
    await venue.save();
    await NotificationService.notifyVenueDecision({
      venueId: String(venue._id),
      venueName: venue.information.venueName,
      ownerId: String(venue.ownerId),
      decision: 'rejected',
      actorId: approver.userId,
      actorName: approver.name,
      actorRole: approver.role
    });

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
    await NotificationService.notifyServiceDecision({
      serviceId: String(service._id),
      serviceName: service.information.serviceName,
      ownerId: String(service.ownerId),
      decision: 'approved',
      actorId: approver.userId,
      actorName: approver.name,
      actorRole: approver.role
    });

    return service;
  }

  static async rejectService(serviceId: string, approver: ApproverInfo) {
    const service = await ServiceProviderServiceModel.findOne({ _id: serviceId, isDeleted: false });
    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    service.publishStatus = 'rejected';
    service.approvedBy = undefined;
    service.approvedAt = undefined;
    await service.save();
    await NotificationService.notifyServiceDecision({
      serviceId: String(service._id),
      serviceName: service.information.serviceName,
      ownerId: String(service.ownerId),
      decision: 'rejected',
      actorId: approver.userId,
      actorName: approver.name,
      actorRole: approver.role
    });

    return service;
  }

  static async getAnalyticsOverview() {
    const currentMonth = getCurrentMonthRangeUtc();
    const activeRevenueStatuses = ['confirmed', 'completed'];

    const [
      totalUsers,
      totalCustomers,
      totalEventPlanners,
      totalServiceProviders,
      totalVenueProviders,
      newUsersCurrentMonth,
      newCustomersCurrentMonth,
      newEventPlannersCurrentMonth,
      newServiceProvidersCurrentMonth,
      newVenueProvidersCurrentMonth,
      revenueAggregation,
      currentMonthRevenueAggregation
    ] = await Promise.all([
      UserModel.countDocuments({ role: { $in: analyticsUserRoles } }),
      UserModel.countDocuments({ role: 'customer' }),
      UserModel.countDocuments({ role: 'event_planner' }),
      UserModel.countDocuments({ role: 'service_provider' }),
      UserModel.countDocuments({ role: 'venue_provider' }),
      UserModel.countDocuments({
        role: { $in: analyticsUserRoles },
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end }
      }),
      UserModel.countDocuments({
        role: 'customer',
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end }
      }),
      UserModel.countDocuments({
        role: 'event_planner',
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end }
      }),
      UserModel.countDocuments({
        role: 'service_provider',
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end }
      }),
      UserModel.countDocuments({
        role: 'venue_provider',
        createdAt: { $gte: currentMonth.start, $lt: currentMonth.end }
      }),
      BookingModel.aggregate([
        { $match: { status: { $in: activeRevenueStatuses } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.totalAmount' },
            totalPlatformRevenue: { $sum: '$pricing.platformFeeAmount' },
            totalBookings: { $sum: 1 }
          }
        }
      ]),
      BookingModel.aggregate([
        {
          $match: {
            status: { $in: activeRevenueStatuses },
            createdAt: { $gte: currentMonth.start, $lt: currentMonth.end }
          }
        },
        {
          $group: {
            _id: null,
            currentMonthRevenue: { $sum: '$pricing.totalAmount' },
            currentMonthPlatformRevenue: { $sum: '$pricing.platformFeeAmount' },
            currentMonthBookings: { $sum: 1 }
          }
        }
      ])
    ]);

    const revenue = revenueAggregation[0] ?? {
      totalRevenue: 0,
      totalPlatformRevenue: 0,
      totalBookings: 0
    };
    const currentRevenue = currentMonthRevenueAggregation[0] ?? {
      currentMonthRevenue: 0,
      currentMonthPlatformRevenue: 0,
      currentMonthBookings: 0
    };

    return {
      revenue: {
        totalRevenue: Number(revenue.totalRevenue ?? 0),
        totalPlatformRevenue: Number(revenue.totalPlatformRevenue ?? 0),
        totalBookings: Number(revenue.totalBookings ?? 0),
        currentMonthRevenue: Number(currentRevenue.currentMonthRevenue ?? 0),
        currentMonthPlatformRevenue: Number(currentRevenue.currentMonthPlatformRevenue ?? 0),
        currentMonthBookings: Number(currentRevenue.currentMonthBookings ?? 0)
      },
      users: {
        totalUsers,
        totalCustomers,
        totalEventPlanners,
        totalServiceProviders,
        totalVenueProviders,
        currentMonth: {
          newUsers: newUsersCurrentMonth,
          newCustomers: newCustomersCurrentMonth,
          newEventPlanners: newEventPlannersCurrentMonth,
          newServiceProviders: newServiceProvidersCurrentMonth,
          newVenueProviders: newVenueProvidersCurrentMonth
        }
      }
    };
  }

  static async getYearlyAnalytics(year: number) {
    const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
    const activeRevenueStatuses = ['confirmed', 'completed'];

    const [monthlyRevenueAggregation, monthlyUserAggregation] = await Promise.all([
      BookingModel.aggregate([
        {
          $match: {
            status: { $in: activeRevenueStatuses },
            createdAt: { $gte: yearStart, $lt: nextYearStart }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$pricing.totalAmount' },
            platformRevenue: { $sum: '$pricing.platformFeeAmount' },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      UserModel.aggregate([
        {
          $match: {
            role: { $in: analyticsUserRoles },
            createdAt: { $gte: yearStart, $lt: nextYearStart }
          }
        },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, role: '$role' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1 } }
      ])
    ]);

    const revenueMap = new Map(
      monthlyRevenueAggregation.map((item) => [
        Number(item._id),
        {
          revenue: Number(item.revenue ?? 0),
          platformRevenue: Number(item.platformRevenue ?? 0),
          bookings: Number(item.bookings ?? 0)
        }
      ])
    );

    const userMap = new Map<
      number,
      {
        totalNewUsers: number;
        newCustomers: number;
        newEventPlanners: number;
        newServiceProviders: number;
        newVenueProviders: number;
      }
    >();

    for (const item of monthlyUserAggregation) {
      const month = Number(item._id.month);
      const count = Number(item.count ?? 0);
      const current =
        userMap.get(month) ??
        {
          totalNewUsers: 0,
          newCustomers: 0,
          newEventPlanners: 0,
          newServiceProviders: 0,
          newVenueProviders: 0
        };

      current.totalNewUsers += count;

      if (item._id.role === 'customer') {
        current.newCustomers = count;
      } else if (item._id.role === 'event_planner') {
        current.newEventPlanners = count;
      } else if (item._id.role === 'service_provider') {
        current.newServiceProviders = count;
      } else if (item._id.role === 'venue_provider') {
        current.newVenueProviders = count;
      }

      userMap.set(month, current);
    }

    return {
      year,
      monthly: MONTH_LABELS.map((label, index) => {
        const monthNumber = index + 1;
        const revenue = revenueMap.get(monthNumber) ?? {
          revenue: 0,
          platformRevenue: 0,
          bookings: 0
        };
        const users =
          userMap.get(monthNumber) ?? {
            totalNewUsers: 0,
            newCustomers: 0,
            newEventPlanners: 0,
            newServiceProviders: 0,
            newVenueProviders: 0
          };

        return {
          month: monthNumber,
          label,
          revenue: revenue.revenue,
          platformRevenue: revenue.platformRevenue,
          bookings: revenue.bookings,
          totalNewUsers: users.totalNewUsers,
          newCustomers: users.newCustomers,
          newEventPlanners: users.newEventPlanners,
          newServiceProviders: users.newServiceProviders,
          newVenueProviders: users.newVenueProviders
        };
      })
    };
  }
}

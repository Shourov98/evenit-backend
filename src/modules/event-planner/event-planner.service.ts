import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { UserModel } from '../auth/auth.model';

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
    T extends { toObject?: () => Record<string, unknown>; profileImage?: unknown; coverImage?: unknown }
  >(
    eventPlanner: T
  ) {
    const plain =
      typeof eventPlanner?.toObject === 'function'
        ? eventPlanner.toObject()
        : ({ ...eventPlanner } as Record<string, unknown>);

    return {
      ...plain,
      profileImage: plain.profileImage ?? null,
      coverImage: plain.coverImage ?? null,
      onboarding: this.normalizeEventPlannerOnboarding(
        plain.onboarding && typeof plain.onboarding === 'object'
          ? (plain.onboarding as Record<string, unknown>)
          : null
      )
    };
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
}

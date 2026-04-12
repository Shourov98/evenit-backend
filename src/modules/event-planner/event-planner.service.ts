import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { UserModel } from '../auth/auth.model';

export class EventPlannerService {
  private static serializeEventPlanner<T extends { toObject?: () => Record<string, unknown>; profileImage?: unknown }>(
    eventPlanner: T
  ) {
    const plain =
      typeof eventPlanner?.toObject === 'function'
        ? eventPlanner.toObject()
        : ({ ...eventPlanner } as Record<string, unknown>);

    return {
      ...plain,
      profileImage: plain.profileImage ?? null
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

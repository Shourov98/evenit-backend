import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { UserModel } from '../auth/auth.model';

export class EventPlannerService {
  static async getPublic(pagination: PaginationOptions) {
    return paginateModel(
      UserModel,
      {
        role: 'event_planner',
        isEmailVerified: true,
        'onboarding.eventProvider': { $exists: true }
      },
      pagination
    );
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

    return eventPlanner;
  }
}

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
}

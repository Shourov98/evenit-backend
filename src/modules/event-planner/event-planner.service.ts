import { PaginationOptions, paginateModel } from '../../common/utils/pagination';
import { UserModel } from '../auth/auth.model';

export class EventPlannerService {
  static async getAll(pagination: PaginationOptions) {
    return paginateModel(
      UserModel,
      {
        role: 'event_provider',
        isEmailVerified: true
      },
      pagination
    );
  }
}

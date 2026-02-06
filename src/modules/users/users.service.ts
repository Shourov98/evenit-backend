import { UsersModel } from './users.model';

export class UsersService {
  static async create(payload: { name: string }) {
    return UsersModel.create(payload);
  }

  static async getAll() {
    return UsersModel.find().sort({ createdAt: -1 });
  }
}

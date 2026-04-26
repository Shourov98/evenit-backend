jest.mock('../../config/env', () => ({
  env: {
    SUPER_ADMIN_NAME: 'Root Admin',
    SUPER_ADMIN_EMAIL: 'root@example.com',
    SUPER_ADMIN_PASSWORD: 'super-secret',
    ADMIN_NAME: '',
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: ''
  }
}));

jest.mock('./auth.model', () => ({
  createDefaultUserSubscription: jest.fn((role: string) => ({ plan: `${role}_plan` })),
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

import { env } from '../../config/env';
import { createDefaultUserSubscription, UserModel } from './auth.model';
import { seedSuperAdminUser } from './super-admin-seed';

describe('seedSuperAdminUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a super admin user when none exists', async () => {
    const findOne = UserModel.findOne as jest.Mock;
    const create = UserModel.create as jest.Mock;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });
    create.mockResolvedValue(undefined);

    await seedSuperAdminUser();

    expect(findOne).toHaveBeenCalledWith({ email: env.SUPER_ADMIN_EMAIL });
    expect(createDefaultUserSubscription).toHaveBeenCalledWith('super_admin');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: env.SUPER_ADMIN_NAME,
        email: env.SUPER_ADMIN_EMAIL,
        password: env.SUPER_ADMIN_PASSWORD,
        role: 'super_admin',
        isEmailVerified: true
      })
    );
    expect(logSpy).toHaveBeenCalledWith(`Seeded super admin user: ${env.SUPER_ADMIN_EMAIL}`);

    logSpy.mockRestore();
  });

  it('accepts an existing super admin user without failing startup', async () => {
    const findOne = UserModel.findOne as jest.Mock;
    const existing = {
      role: 'super_admin',
      isEmailVerified: false,
      fullName: 'Old Name',
      save: jest.fn().mockResolvedValue(undefined)
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(existing)
    });

    await seedSuperAdminUser();

    expect(existing.isEmailVerified).toBe(true);
    expect(existing.fullName).toBe(env.SUPER_ADMIN_NAME);
    expect(existing.save).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      `Super admin user already exists: ${env.SUPER_ADMIN_EMAIL}`
    );

    logSpy.mockRestore();
  });
});

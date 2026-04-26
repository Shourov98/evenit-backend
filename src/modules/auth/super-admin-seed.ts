import { env } from '../../config/env';
import { createDefaultUserSubscription, UserModel } from './auth.model';

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const getSeedValue = (primary: string, fallback: string): string =>
  primary.trim() || fallback.trim();

export const seedSuperAdminUser = async (): Promise<void> => {
  const email = getSeedValue(env.SUPER_ADMIN_EMAIL, env.ADMIN_EMAIL);
  const password = getSeedValue(env.SUPER_ADMIN_PASSWORD, env.ADMIN_PASSWORD);
  const fullName =
    getSeedValue(env.SUPER_ADMIN_NAME, env.ADMIN_NAME) || 'Super Admin';

  if (!email && !password) {
    return;
  }

  if (!email || !password) {
    throw new Error(
      'Both SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be provided to seed the super admin user'
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await UserModel.findOne({ email: normalizedEmail }).select('+password');

  if (existing) {
    if (existing.role !== 'super_admin') {
      throw new Error(
        `SUPER_ADMIN_EMAIL ${normalizedEmail} already exists with role ${existing.role}`
      );
    }

    let shouldSave = false;

    if (!existing.isEmailVerified) {
      existing.isEmailVerified = true;
      shouldSave = true;
    }

    if (existing.fullName !== fullName) {
      existing.fullName = fullName;
      shouldSave = true;
    }

    if (shouldSave) {
      await existing.save();
    }

    console.log(`Super admin user already exists: ${normalizedEmail}`);
    return;
  }

  await UserModel.create({
    fullName,
    email: normalizedEmail,
    password,
    role: 'super_admin',
    serviceCategories: [],
    isEmailVerified: true,
    subscription: createDefaultUserSubscription('super_admin')
  });

  console.log(`Seeded super admin user: ${normalizedEmail}`);
};

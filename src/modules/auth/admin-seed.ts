import { env } from '../../config/env';
import { createDefaultUserSubscription, UserModel } from './auth.model';

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const seedAdminUser = async (): Promise<void> => {
  const email = env.ADMIN_EMAIL.trim();
  const password = env.ADMIN_PASSWORD.trim();
  const fullName = env.ADMIN_NAME.trim() || 'Admin';

  if (!email && !password) {
    return;
  }

  if (!email || !password) {
    throw new Error('Both ADMIN_EMAIL and ADMIN_PASSWORD must be provided to seed the admin user');
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await UserModel.findOne({ email: normalizedEmail }).select('+password');

  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error(`ADMIN_EMAIL ${normalizedEmail} already exists with role ${existing.role}`);
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

    console.log(`Admin user already exists: ${normalizedEmail}`);
    return;
  }

  await UserModel.create({
    fullName,
    email: normalizedEmail,
    password,
    role: 'admin',
    serviceCategories: [],
    isEmailVerified: true,
    subscription: createDefaultUserSubscription('admin')
  });

  console.log(`Seeded admin user: ${normalizedEmail}`);
};

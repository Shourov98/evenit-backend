import { IUser } from '../../modules/auth/auth.model';

type ProviderUser = Pick<IUser, '_id' | 'fullName' | 'role' | 'onboarding'> | null | undefined;
type AdminOwnerUser =
  | Pick<IUser, '_id' | 'fullName' | 'email' | 'role' | 'isEmailVerified' | 'isBlocked' | 'onboarding'>
  | null
  | undefined;

export const buildPublicProviderInfo = (user: ProviderUser) => {
  if (!user) {
    return null;
  }

  if (user.role === 'service_provider' && user.onboarding?.serviceProvider) {
    const profileInfo = user.onboarding.serviceProvider.profileInfo;

    return {
      _id: user._id,
      fullName: user.fullName,
      role: user.role,
      serviceProvider: {
        serviceName: profileInfo.serviceName,
        serviceCategory: profileInfo.serviceCategory,
        serviceDescription: profileInfo.serviceDescription,
        coverageArea: profileInfo.coverageArea
      }
    };
  }

  if (user.role === 'venue_provider' && user.onboarding?.venueProvider) {
    const venueProvider = user.onboarding.venueProvider;

    return {
      _id: user._id,
      fullName: user.fullName,
      role: user.role,
      venueProvider: {
        businessName: venueProvider.businessName,
        businessType: venueProvider.businessType,
        legalBusinessName: venueProvider.legalBusinessName,
        businessMail: venueProvider.businessMail,
        businessPhoneNo: venueProvider.businessPhoneNo
      }
    };
  }

  return {
    _id: user._id,
    fullName: user.fullName,
    role: user.role
  };
};

export const buildAdminOwnerInfo = (user: AdminOwnerUser) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isBlocked: user.isBlocked,
    provider: buildPublicProviderInfo(user)
  };
};

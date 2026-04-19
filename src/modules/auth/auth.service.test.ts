import { AuthService } from './auth.service';
import { UserModel } from './auth.model';

jest.mock('./auth.model', () => ({
  hydrateUserSubscription: jest.fn((_: unknown, subscription: unknown) => subscription),
  UserModel: {
    findById: jest.fn()
  }
}));

describe('AuthService.updateProfile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updates event planner phone and location without requiring verification files in the payload', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      _id: 'user-1',
      role: 'event_planner',
      fullName: 'Event Planner Example',
      email: 'planner@example.com',
      phoneNumber: '+8801700000000',
      subscription: {
        status: 'subscribed',
        planKey: 'basic_monthly'
      },
      onboarding: {
        verification: {
          businessType: 'company',
          companyName: 'Planner Co',
          nationalIdOrTradeLicenseUrl: 'https://cdn.example.com/existing-license.pdf'
        },
        eventProvider: {
          fullName: 'Event Planner Example',
          email: 'planner@example.com',
          profileInfo: {
            nidOrTradeLicenseNumber: 'EP-123',
            name: 'Planner Profile',
            coverageArea: ['Dhaka'],
            address: 'Banani, Dhaka',
            verification: {
              businessType: 'company',
              companyName: 'Planner Co'
            }
          }
        }
      },
      save
    };

    (UserModel.findById as jest.Mock).mockResolvedValue(user);

    const result = await AuthService.updateProfile({
      userId: 'user-1',
      role: 'event_planner',
      phoneNumber: '+8801712345677',
      eventPlanner: {
        profileInfo: {
          coverageArea: ['Dhaka', 'Chattogram', 'Sylhet'],
          address: 'Gulshan, Dhaka'
        }
      }
    });
    const onboarding = result.onboarding!;
    const eventProvider = onboarding.eventProvider!;

    expect(result.phoneNumber).toBe('+8801712345677');
    expect(eventProvider.profileInfo.coverageArea).toEqual([
      'Dhaka',
      'Chattogram',
      'Sylhet'
    ]);
    expect(eventProvider.profileInfo.address).toBe('Gulshan, Dhaka');
    expect(onboarding.verification.nationalIdOrTradeLicenseUrl).toBe(
      'https://cdn.example.com/existing-license.pdf'
    );
    expect(save).toHaveBeenCalled();
  });

  it('backfills missing nested event planner verification from top-level onboarding verification', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      _id: 'user-2',
      role: 'event_planner',
      fullName: 'Legacy Planner',
      email: 'legacy@example.com',
      phoneNumber: '+8801700000001',
      subscription: {
        status: 'subscribed',
        planKey: 'basic_monthly'
      },
      onboarding: {
        verification: {
          businessType: 'company',
          companyName: 'Legacy Planner Co',
          nationalIdOrTradeLicenseUrl: 'https://cdn.example.com/legacy-license.pdf'
        },
        eventProvider: {
          fullName: 'Legacy Planner',
          email: 'legacy@example.com',
          profileInfo: {
            nidOrTradeLicenseNumber: 'EP-456',
            name: 'Legacy Planner Profile',
            coverageArea: ['Dhaka'],
            address: 'Banani, Dhaka'
          }
        }
      },
      save
    };

    (UserModel.findById as jest.Mock).mockResolvedValue(user);

    const result = await AuthService.updateProfile({
      userId: 'user-2',
      role: 'event_planner',
      phoneNumber: '+8801712345677',
      eventPlanner: {
        profileInfo: {
          coverageArea: ['Dhaka', 'Chattogram', 'Sylhet'],
          address: 'Gulshan, Dhaka'
        }
      }
    });

    const eventProvider = result.onboarding!.eventProvider!;
    expect(eventProvider.profileInfo.verification).toEqual({
      businessType: 'company',
      companyName: 'Legacy Planner Co',
      nationalIdOrTradeLicenseFiles: ['https://cdn.example.com/legacy-license.pdf']
    });
    expect(save).toHaveBeenCalled();
  });

  it('allows service provider phone-only updates when legacy onboarding data is missing', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      _id: 'user-3',
      role: 'service_provider',
      fullName: 'Legacy Service Provider',
      email: 'service@example.com',
      phoneNumber: '+8801700000002',
      subscription: {
        status: 'subscribed',
        planKey: 'basic_monthly'
      },
      onboarding: undefined,
      save
    };

    (UserModel.findById as jest.Mock).mockResolvedValue(user);

    const result = await AuthService.updateProfile({
      userId: 'user-3',
      role: 'service_provider',
      phoneNumber: '+8801712345678',
      serviceProvider: {}
    });

    expect(result.phoneNumber).toBe('+8801712345678');
    expect(save).toHaveBeenCalled();
  });

  it('updates fullName and keeps provider onboarding names in sync', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      _id: 'user-4',
      role: 'event_planner',
      fullName: 'Legacy Planner',
      email: 'legacy@example.com',
      phoneNumber: '+8801700000001',
      subscription: {
        status: 'subscribed',
        planKey: 'basic_monthly'
      },
      onboarding: {
        verification: {
          businessType: 'company',
          companyName: 'Legacy Planner Co',
          nationalIdOrTradeLicenseUrl: 'https://cdn.example.com/legacy-license.pdf'
        },
        eventProvider: {
          fullName: 'Legacy Planner',
          email: 'legacy@example.com',
          profileInfo: {
            nidOrTradeLicenseNumber: 'EP-456',
            name: 'Legacy Planner Profile',
            coverageArea: ['Dhaka'],
            address: 'Banani, Dhaka'
          }
        }
      },
      save
    };

    (UserModel.findById as jest.Mock).mockResolvedValue(user);

    const result = await AuthService.updateProfile({
      userId: 'user-4',
      role: 'event_planner',
      fullName: 'Updated Planner Name'
    });

    expect(result.fullName).toBe('Updated Planner Name');
    expect(result.onboarding!.eventProvider!.fullName).toBe('Updated Planner Name');
    expect(save).toHaveBeenCalled();
  });
});

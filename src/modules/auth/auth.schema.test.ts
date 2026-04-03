import {
  submitEventProviderOnboardingSchema,
  submitVenueProviderOnboardingSchema
} from './auth.schema';

describe('auth onboarding schemas', () => {
  it('accepts event planner onboarding without stripeAccountId', () => {
    const result = submitEventProviderOnboardingSchema.safeParse({
      body: {
        _id: '65f1a9d0f1b2c3d4e5f60002',
        fullName: 'Event Planner Example',
        email: 'event.planner@example.com',
        profileInfo: {
          name: 'Event Planner Example',
          coverageArea: ['Dhaka'],
          address: 'Banani, Dhaka',
          verification: {
            businessType: 'individual',
            nationalIdOrTradeLicenseFiles: ['https://cdn.example.com/trade-license.pdf']
          }
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts venue provider onboarding without stripeAccountId', () => {
    const result = submitVenueProviderOnboardingSchema.safeParse({
      body: {
        _id: '65f1a9d0f1b2c3d4e5f60003',
        fullName: 'Venue Provider Example',
        email: 'venue.provider@example.com',
        businessName: 'Royal Hall',
        businessType: 'company',
        legalBusinessName: 'Royal Hall Ltd',
        registrationNo: 'TR-123456',
        businessMail: 'business@royalhall.com',
        businessPhoneNo: '+8801712345678'
      }
    });

    expect(result.success).toBe(true);
  });
});

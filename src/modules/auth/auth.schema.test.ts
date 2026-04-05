import {
  submitServiceProviderOnboardingSchema,
  submitEventProviderOnboardingSchema,
  submitVenueProviderOnboardingSchema
} from './auth.schema';

describe('auth onboarding schemas', () => {
  it('accepts service provider onboarding with nidOrTradeLicenseNumber inside profileInfo', () => {
    const result = submitServiceProviderOnboardingSchema.safeParse({
      body: {
        _id: '65f1a9d0f1b2c3d4e5f60001',
        name: 'Service Provider Example',
        email: 'service.provider@example.com',
        profileInfo: {
          nidOrTradeLicenseNumber: '1234567890123',
          serviceName: 'Premium Catering',
          serviceCategory: 'Catering',
          coverageArea: ['Dhaka'],
          verification: {
            businessType: 'individual',
            nationalIdOrTradeLicenseFiles: ['https://cdn.example.com/trade-license.pdf']
          }
        },
        services: []
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts event planner onboarding without stripeAccountId', () => {
    const result = submitEventProviderOnboardingSchema.safeParse({
      body: {
        _id: '65f1a9d0f1b2c3d4e5f60002',
        fullName: 'Event Planner Example',
        email: 'event.planner@example.com',
        profileInfo: {
          nidOrTradeLicenseNumber: '1234567890123',
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
        profileInfo: {
          nidOrTradeLicenseNumber: '1234567890123',
          businessName: 'Royal Hall',
          businessType: 'company',
          legalBusinessName: 'Royal Hall Ltd',
          registrationNo: 'TR-123456',
          businessMail: 'business@royalhall.com',
          businessPhoneNo: '+8801712345678'
        }
      }
    });

    expect(result.success).toBe(true);
  });
});

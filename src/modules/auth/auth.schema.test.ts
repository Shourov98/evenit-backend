import {
  submitServiceProviderOnboardingSchema,
  submitEventProviderOnboardingSchema,
  submitVenueProviderOnboardingSchema,
  updateCustomerProfileSchema,
  updateEventPlannerProfileRequestSchema,
  updateServiceProviderProfileRequestSchema,
  updateVenueProviderProfileRequestSchema
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

  it('accepts fullName updates for service provider profiles', () => {
    const result = updateServiceProviderProfileRequestSchema.safeParse({
      body: {
        fullName: 'Updated Provider Name'
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts service provider location-only profile updates', () => {
    const result = updateServiceProviderProfileRequestSchema.safeParse({
      body: {
        phoneNumber: '+8801712345678',
        serviceProvider: {
          profileInfo: {
            coverageArea: ['Dhaka', 'Gazipur']
          }
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts event planner phone and location updates only', () => {
    const result = updateEventPlannerProfileRequestSchema.safeParse({
      body: {
        phoneNumber: '+8801712345678',
        eventPlanner: {
          profileInfo: {
            coverageArea: ['Dhaka'],
            address: 'Banani, Dhaka'
          }
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts event planner fullName updates', () => {
    const result = updateEventPlannerProfileRequestSchema.safeParse({
      body: {
        fullName: 'Updated Planner Name'
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts venue provider phone-only updates', () => {
    const result = updateVenueProviderProfileRequestSchema.safeParse({
      body: {
        phoneNumber: '+8801712345678',
        venueProvider: {
          profileInfo: {
            businessPhoneNo: '+8801712345678'
          }
        }
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts venue provider fullName updates', () => {
    const result = updateVenueProviderProfileRequestSchema.safeParse({
      body: {
        fullName: 'Updated Venue Name'
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty customer profile update body', () => {
    const result = updateCustomerProfileSchema.safeParse({
      body: {}
    });

    expect(result.success).toBe(true);
  });

  it('accepts a customer phone-only update', () => {
    const result = updateCustomerProfileSchema.safeParse({
      body: {
        phoneNumber: '+8801712345678'
      }
    });

    expect(result.success).toBe(true);
  });

  it('accepts a customer fullName-only update', () => {
    const result = updateCustomerProfileSchema.safeParse({
      body: {
        fullName: 'Updated Customer Name'
      }
    });

    expect(result.success).toBe(true);
  });
});

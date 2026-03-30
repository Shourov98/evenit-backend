const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.resolve(process.cwd(), 'apidog.collection.json');

const variables = [
  { key: 'baseUrl', value: 'http://localhost:5000' },
  { key: 'customerToken', value: '' },
  { key: 'serviceProviderToken', value: '' },
  { key: 'venueProviderToken', value: '' },
  { key: 'eventPlannerToken', value: '' },
  { key: 'adminToken', value: '' },
  { key: 'superAdminToken', value: '' },
  { key: 'serviceId', value: '' },
  { key: 'venueId', value: '' },
  { key: 'eventPlannerId', value: '' },
  { key: 'bookingId', value: '' },
  { key: 'adminUserId', value: '' }
];

const toCollectionPath = (endpoint) =>
  endpoint
    .replace(/\{([A-Za-z0-9_]+)\}/g, '{{$1}}')
    .split('/')
    .filter(Boolean);

const buildUrl = (endpoint, query = []) => {
  const postmanPath = toCollectionPath(endpoint);
  const rawPath = `/${postmanPath.join('/')}`;
  const queryString = query.length
    ? `?${query
        .map((item) => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
        .join('&')}`
    : '';

  return {
    raw: `{{baseUrl}}${rawPath}${queryString}`,
    host: ['{{baseUrl}}'],
    path: postmanPath,
    ...(query.length
      ? {
          query: query.map((item) => ({
            key: item.key,
            value: item.value,
            ...(item.description ? { description: item.description } : {})
          }))
        }
      : {})
  };
};

const buildHeaders = ({ tokenVar, contentType } = {}) => {
  const headers = [];

  if (contentType) {
    headers.push({ key: 'Content-Type', value: contentType });
  }

  if (tokenVar) {
    headers.push({ key: 'Authorization', value: `Bearer {{${tokenVar}}}` });
  }

  return headers;
};

const jsonBody = (value) => ({
  mode: 'raw',
  raw: JSON.stringify(value, null, 2),
  options: {
    raw: {
      language: 'json'
    }
  }
});

const formDataBody = (fields) => ({
  mode: 'formdata',
  formdata: fields.map((field) => ({
    key: field.key,
    type: field.type || 'text',
    ...(field.type === 'file' ? { src: field.src || [] } : { value: field.value || '' }),
    ...(field.description ? { description: field.description } : {})
  }))
});

const request = (name, method, endpoint, options = {}) => ({
  name,
  request: {
    method,
    ...(options.description ? { description: options.description } : {}),
    ...(buildHeaders(options).length ? { header: buildHeaders(options) } : {}),
    ...(options.body ? { body: options.body } : {}),
    url: buildUrl(endpoint, options.query || [])
  }
});

const folder = (name, items) => ({ name, item: items });

const paginationQuery = [
  { key: 'page', value: '1' },
  { key: 'limit', value: '10' },
  { key: 'sortBy', value: 'createdAt' },
  { key: 'sortOrder', value: 'desc' }
];

const bookingListQuery = [...paginationQuery, { key: 'status', value: 'pending' }];

const customerAuth = folder('Auth', [
  request('Register Customer', 'POST', '/api/v1/auth/register', {
    contentType: 'application/json',
    body: jsonBody({
      fullName: 'Customer Example',
      email: 'customer@example.com',
      password: 'StrongPass123',
      role: 'customer'
    })
  }),
  request('Verify Email OTP', 'POST', '/api/v1/auth/verify-email', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'customer@example.com',
      otp: '123456'
    })
  }),
  request('Resend Verification OTP', 'POST', '/api/v1/auth/resend-verification-otp', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'customer@example.com'
    })
  }),
  request('Login Customer', 'POST', '/api/v1/auth/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'customer@example.com',
      password: 'StrongPass123'
    })
  }),
  request('Forgot Password', 'POST', '/api/v1/auth/forgot-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'customer@example.com'
    })
  }),
  request('Reset Password', 'POST', '/api/v1/auth/reset-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'customer@example.com',
      otp: '123456',
      newPassword: 'NewStrongPass123'
    })
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'customerToken'
  })
]);

const customerBookings = folder('Bookings', [
  request('Create Booking', 'POST', '/api/v1/bookings', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({
      targetType: 'service',
      targetId: '{{serviceId}}',
      bookingDate: '2026-04-10',
      timeSlots: ['10:00', '11:00'],
      durationHours: 2,
      location: 'Banani, Dhaka',
      specialInstructions: 'Please confirm decoration options.'
    })
  }),
  request('Create Service Booking', 'POST', '/api/v1/bookings/services/{serviceId}', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({
      bookingDate: '2026-04-10',
      timeSlots: ['10:00', '11:00'],
      durationHours: 2,
      location: 'Banani, Dhaka',
      specialInstructions: 'Need premium package.'
    })
  }),
  request('Create Venue Booking', 'POST', '/api/v1/bookings/venues/{venueId}', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({
      bookingDate: '2026-04-15',
      timeSlots: ['14:00', '15:00', '16:00'],
      durationHours: 3,
      specialInstructions: 'Need projector and stage.'
    })
  }),
  request('Create Event Planner Booking', 'POST', '/api/v1/bookings/event-planners/{eventPlannerId}', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({
      bookingDate: '2026-04-20',
      timeSlots: ['09:00', '10:00'],
      durationHours: 2,
      location: 'Gulshan, Dhaka',
      specialInstructions: 'Wedding planning consultation.'
    })
  }),
  request('Get My Bookings', 'GET', '/api/v1/bookings/my', {
    tokenVar: 'customerToken',
    query: bookingListQuery
  }),
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'customerToken'
  }),
  request('Cancel Booking', 'PATCH', '/api/v1/bookings/{bookingId}/cancel', {
    tokenVar: 'customerToken'
  })
]);

const customerSubscriptions = folder('Subscriptions', [
  request('Create Subscription Payment Intent', 'POST', '/api/v1/subscriptions/payment-intent', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({})
  }),
  request('Verify Subscription Payment', 'POST', '/api/v1/subscriptions/verify-payment', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({
      paymentIntentId: 'pi_example_123'
    })
  })
]);

const serviceProviderAuth = folder('Auth', [
  request('Register Service Provider', 'POST', '/api/v1/auth/register', {
    contentType: 'application/json',
    body: jsonBody({
      fullName: 'Service Provider Example',
      email: 'service.provider@example.com',
      password: 'StrongPass123',
      role: 'service_provider'
    })
  }),
  request('Verify Email OTP', 'POST', '/api/v1/auth/verify-email', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'service.provider@example.com',
      otp: '123456'
    })
  }),
  request('Resend Verification OTP', 'POST', '/api/v1/auth/resend-verification-otp', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'service.provider@example.com'
    })
  }),
  request('Login Service Provider', 'POST', '/api/v1/auth/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'service.provider@example.com',
      password: 'StrongPass123'
    })
  }),
  request('Forgot Password', 'POST', '/api/v1/auth/forgot-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'service.provider@example.com'
    })
  }),
  request('Reset Password', 'POST', '/api/v1/auth/reset-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'service.provider@example.com',
      otp: '123456',
      newPassword: 'NewStrongPass123'
    })
  }),
  request('Submit Service Provider Onboarding', 'POST', '/api/v1/auth/onboarding/service-provider', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      _id: '65f1a9d0f1b2c3d4e5f60001',
      name: 'Service Provider Example',
      email: 'service.provider@example.com',
      stripeAccountId: 'acct_service_provider_123',
      profileInfo: {
        serviceName: 'Premium Catering',
        serviceCategory: 'Catering',
        serviceDescription: 'Corporate and wedding catering services',
        coverageArea: ['Dhaka', 'Gazipur'],
        verification: {
          businessType: 'individual',
          nationalIdOrTradeLicenseFiles: [
            'https://cdn.example.com/nid-front.jpg',
            'https://cdn.example.com/trade-license.pdf'
          ]
        }
      },
      services: []
    })
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'serviceProviderToken'
  })
]);

const serviceProviderServices = folder('Services', [
  request('Get Published Services (Public)', 'GET', '/api/v1/service-provider/services', {
    query: paginationQuery
  }),
  request('Get Published Service By ID (Public)', 'GET', '/api/v1/service-provider/services/{serviceId}'),
  request('Create Service', 'POST', '/api/v1/service-provider/services', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      information: {
        serviceName: 'Premium Catering',
        category: 'Catering',
        description: 'Corporate and wedding catering',
        serviceArea: ['Dhaka', 'Gazipur'],
        tags: ['wedding', 'corporate']
      },
      pricing: {
        amount: 50000,
        pricingType: 'package',
        currency: 'BDT',
        discount: {
          type: 'percentage',
          value: 10
        }
      },
      settings: {
        amenities: {
          deliveryIncluded: true,
          setupIncluded: true,
          staffIncluded: false
        },
        capacity: 300
      },
      media: {
        galleryImages: [
          'https://cdn.example.com/service/image-1.jpg',
          'https://cdn.example.com/service/image-2.jpg'
        ],
        videoUrl: 'https://youtube.com/watch?v=abc123'
      },
      availabilityOverrides: [
        {
          date: '2026-04-12',
          slots: [
            { hour: 10, status: 'booked' },
            { hour: 11, status: 'booked' }
          ]
        }
      ]
    })
  }),
  request('Update Service', 'PATCH', '/api/v1/service-provider/services/{serviceId}', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      pricing: {
        amount: 45000,
        discount: {
          type: 'fixed',
          value: 5000
        }
      },
      availabilityOverrides: [
        {
          date: '2026-04-13',
          slots: [{ hour: 12, status: 'booked' }]
        }
      ]
    })
  }),
  request('Delete Service', 'DELETE', '/api/v1/service-provider/services/{serviceId}', {
    tokenVar: 'serviceProviderToken'
  })
]);

const sharedImageUploadBody = formDataBody([
  { key: 'folder', value: 'services' },
  { key: 'images', type: 'file', description: 'Attach one or more images' }
]);

const serviceProviderUploads = folder('Uploads', [
  request('Upload Images', 'POST', '/api/v1/uploads/images', {
    tokenVar: 'serviceProviderToken',
    body: sharedImageUploadBody
  })
]);

const serviceProviderBookings = folder('Bookings', [
  request('Get Provider Bookings', 'GET', '/api/v1/bookings/provider', {
    tokenVar: 'serviceProviderToken',
    query: bookingListQuery
  }),
  request('Get Service Provider Booking Requests', 'GET', '/api/v1/bookings/service-provider', {
    tokenVar: 'serviceProviderToken',
    query: bookingListQuery
  }),
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'serviceProviderToken'
  }),
  request('Approve Booking As Service Provider', 'PATCH', '/api/v1/bookings/service-provider/{bookingId}/approve', {
    tokenVar: 'serviceProviderToken'
  }),
  request('Reject Booking As Service Provider', 'PATCH', '/api/v1/bookings/service-provider/{bookingId}/reject', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      reason: 'Selected slots are unavailable.'
    })
  })
]);

const serviceProviderSubscriptions = folder('Subscriptions', [
  request('Create Subscription Payment Intent', 'POST', '/api/v1/subscriptions/payment-intent', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    body: jsonBody({})
  }),
  request('Verify Subscription Payment', 'POST', '/api/v1/subscriptions/verify-payment', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      paymentIntentId: 'pi_example_123'
    })
  })
]);

const venueProviderAuth = folder('Auth', [
  request('Register Venue Provider', 'POST', '/api/v1/auth/register', {
    contentType: 'application/json',
    body: jsonBody({
      fullName: 'Venue Provider Example',
      email: 'venue.provider@example.com',
      password: 'StrongPass123',
      role: 'venue_provider'
    })
  }),
  request('Verify Email OTP', 'POST', '/api/v1/auth/verify-email', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'venue.provider@example.com',
      otp: '123456'
    })
  }),
  request('Resend Verification OTP', 'POST', '/api/v1/auth/resend-verification-otp', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'venue.provider@example.com'
    })
  }),
  request('Login Venue Provider', 'POST', '/api/v1/auth/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'venue.provider@example.com',
      password: 'StrongPass123'
    })
  }),
  request('Forgot Password', 'POST', '/api/v1/auth/forgot-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'venue.provider@example.com'
    })
  }),
  request('Reset Password', 'POST', '/api/v1/auth/reset-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'venue.provider@example.com',
      otp: '123456',
      newPassword: 'NewStrongPass123'
    })
  }),
  request('Submit Venue Provider Onboarding', 'POST', '/api/v1/auth/onboarding/venue-provider', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      _id: '65f1a9d0f1b2c3d4e5f60003',
      fullName: 'Venue Provider Example',
      email: 'venue.provider@example.com',
      stripeAccountId: 'acct_venue_provider_123',
      businessName: 'Royal Hall',
      businessType: 'company',
      legalBusinessName: 'Royal Hall Ltd',
      registrationNo: 'TR-123456',
      businessMail: 'business@royalhall.com',
      businessPhoneNo: '+8801712345678'
    })
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'venueProviderToken'
  })
]);

const venueProviderVenues = folder('Venues', [
  request('Get Published Venues (Public)', 'GET', '/api/v1/venue-provider/venues', {
    query: paginationQuery
  }),
  request('Get Published Venue By ID (Public)', 'GET', '/api/v1/venue-provider/venues/{venueId}'),
  request('Create Venue', 'POST', '/api/v1/venue-provider/venues', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      information: {
        venueName: 'Royal Hall',
        venueType: 'Banquet',
        description: 'Large indoor venue',
        addressLine: 'Road 12, Dhanmondi',
        city: 'Dhaka',
        area: 'Dhanmondi'
      },
      pricing: {
        basePrice: 120000,
        currency: 'BDT',
        discount: {
          type: 'percentage',
          value: 15
        },
        amenities: {
          parking: true,
          airConditioned: true,
          stage: true
        }
      },
      capacity: {
        maximumGuests: 500
      },
      media: {
        galleryImages: [
          'https://cdn.example.com/venue/image-1.jpg',
          'https://cdn.example.com/venue/image-2.jpg'
        ],
        videoUrl: 'https://youtube.com/watch?v=venue123'
      },
      availabilityOverrides: [
        {
          date: '2026-04-18',
          slots: [
            { hour: 14, status: 'booked' },
            { hour: 15, status: 'booked' }
          ]
        }
      ]
    })
  }),
  request('Update Venue', 'PATCH', '/api/v1/venue-provider/venues/{venueId}', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      capacity: {
        maximumGuests: 550
      },
      availabilityOverrides: [
        {
          date: '2026-04-19',
          slots: [{ hour: 18, status: 'booked' }]
        }
      ]
    })
  }),
  request('Delete Venue', 'DELETE', '/api/v1/venue-provider/venues/{venueId}', {
    tokenVar: 'venueProviderToken'
  })
]);

const venueProviderUploads = folder('Uploads', [
  request('Upload Images', 'POST', '/api/v1/uploads/images', {
    tokenVar: 'venueProviderToken',
    body: formDataBody([
      { key: 'folder', value: 'venues' },
      { key: 'images', type: 'file', description: 'Attach one or more images' }
    ])
  }),
  request('Upload Venue Images', 'POST', '/api/v1/uploads/venue-images', {
    tokenVar: 'venueProviderToken',
    body: formDataBody([{ key: 'images', type: 'file', description: 'Attach one or more venue images' }])
  })
]);

const venueProviderBookings = folder('Bookings', [
  request('Get Provider Bookings', 'GET', '/api/v1/bookings/provider', {
    tokenVar: 'venueProviderToken',
    query: bookingListQuery
  }),
  request('Get Venue Provider Booking Requests', 'GET', '/api/v1/bookings/venue-provider', {
    tokenVar: 'venueProviderToken',
    query: bookingListQuery
  }),
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'venueProviderToken'
  }),
  request('Approve Booking As Venue Provider', 'PATCH', '/api/v1/bookings/venue-provider/{bookingId}/approve', {
    tokenVar: 'venueProviderToken'
  }),
  request('Reject Booking As Venue Provider', 'PATCH', '/api/v1/bookings/venue-provider/{bookingId}/reject', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      reason: 'Venue is unavailable on the selected date.'
    })
  })
]);

const venueProviderSubscriptions = folder('Subscriptions', [
  request('Create Subscription Payment Intent', 'POST', '/api/v1/subscriptions/payment-intent', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    body: jsonBody({})
  }),
  request('Verify Subscription Payment', 'POST', '/api/v1/subscriptions/verify-payment', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    body: jsonBody({
      paymentIntentId: 'pi_example_123'
    })
  })
]);

const eventPlannerAuth = folder('Auth', [
  request('Register Event Planner', 'POST', '/api/v1/auth/register', {
    contentType: 'application/json',
    body: jsonBody({
      fullName: 'Event Planner Example',
      email: 'event.planner@example.com',
      password: 'StrongPass123',
      role: 'event_planner'
    })
  }),
  request('Verify Email OTP', 'POST', '/api/v1/auth/verify-email', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'event.planner@example.com',
      otp: '123456'
    })
  }),
  request('Resend Verification OTP', 'POST', '/api/v1/auth/resend-verification-otp', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'event.planner@example.com'
    })
  }),
  request('Login Event Planner', 'POST', '/api/v1/auth/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'event.planner@example.com',
      password: 'StrongPass123'
    })
  }),
  request('Forgot Password', 'POST', '/api/v1/auth/forgot-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'event.planner@example.com'
    })
  }),
  request('Reset Password', 'POST', '/api/v1/auth/reset-password', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'event.planner@example.com',
      otp: '123456',
      newPassword: 'NewStrongPass123'
    })
  }),
  request('Submit Event Planner Onboarding', 'POST', '/api/v1/auth/onboarding/event-planner', {
    tokenVar: 'eventPlannerToken',
    contentType: 'application/json',
    body: jsonBody({
      _id: '65f1a9d0f1b2c3d4e5f60002',
      fullName: 'Event Planner Example',
      email: 'event.planner@example.com',
      stripeAccountId: 'acct_event_planner_123',
      profileInfo: {
        name: 'Event Planner Example',
        description: 'Wedding and corporate event planning',
        coverageArea: ['Dhaka', 'Chattogram'],
        address: 'Banani, Dhaka',
        verification: {
          businessType: 'company',
          companyName: 'Events Ltd',
          nationalIdOrTradeLicenseFiles: [
            'https://cdn.example.com/trade-license.pdf'
          ]
        }
      }
    })
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'eventPlannerToken'
  })
]);

const eventPlannerPublic = folder('Public APIs', [
  request('Get Event Planners (Public)', 'GET', '/api/v1/event-planners', {
    query: paginationQuery
  }),
  request('Get Public Event Planners', 'GET', '/api/v1/public/event-planners', {
    query: paginationQuery
  }),
  request('Get Public Event Planner By ID', 'GET', '/api/v1/public/event-planners/{eventPlannerId}')
]);

const eventPlannerUploads = folder('Uploads', [
  request('Upload Images', 'POST', '/api/v1/uploads/images', {
    tokenVar: 'eventPlannerToken',
    body: formDataBody([
      { key: 'folder', value: 'event-planners' },
      { key: 'images', type: 'file', description: 'Attach one or more images' }
    ])
  })
]);

const eventPlannerBookings = folder('Bookings', [
  request('Get Provider Bookings', 'GET', '/api/v1/bookings/provider', {
    tokenVar: 'eventPlannerToken',
    query: bookingListQuery
  }),
  request('Get Event Planner Booking Requests', 'GET', '/api/v1/bookings/event-planner', {
    tokenVar: 'eventPlannerToken',
    query: bookingListQuery
  }),
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'eventPlannerToken'
  }),
  request('Approve Booking As Event Planner', 'PATCH', '/api/v1/bookings/event-planner/{bookingId}/approve', {
    tokenVar: 'eventPlannerToken'
  }),
  request('Reject Booking As Event Planner', 'PATCH', '/api/v1/bookings/event-planner/{bookingId}/reject', {
    tokenVar: 'eventPlannerToken',
    contentType: 'application/json',
    body: jsonBody({
      reason: 'Planner is not available at the selected time.'
    })
  })
]);

const eventPlannerSubscriptions = folder('Subscriptions', [
  request('Create Subscription Payment Intent', 'POST', '/api/v1/subscriptions/payment-intent', {
    tokenVar: 'eventPlannerToken',
    contentType: 'application/json',
    body: jsonBody({})
  }),
  request('Verify Subscription Payment', 'POST', '/api/v1/subscriptions/verify-payment', {
    tokenVar: 'eventPlannerToken',
    contentType: 'application/json',
    body: jsonBody({
      paymentIntentId: 'pi_example_123'
    })
  })
]);

const adminAuth = folder('Auth', [
  request('Login Admin Or Super Admin', 'POST', '/api/v1/auth/admin/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'admin@example.com',
      password: 'StrongAdminPass123'
    })
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'adminToken'
  })
]);

const adminModeration = folder('Moderation', [
  request('Get All Venues', 'GET', '/api/v1/admin/venues', {
    tokenVar: 'adminToken',
    query: paginationQuery
  }),
  request('Get Venue By ID', 'GET', '/api/v1/admin/venues/{venueId}', {
    tokenVar: 'adminToken'
  }),
  request('Get Pending Venues', 'GET', '/api/v1/admin/venues/pending', {
    tokenVar: 'adminToken',
    query: paginationQuery
  }),
  request('Approve Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/approve', {
    tokenVar: 'adminToken'
  }),
  request('Reject Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/reject', {
    tokenVar: 'adminToken'
  }),
  request('Get All Services', 'GET', '/api/v1/admin/services', {
    tokenVar: 'adminToken',
    query: paginationQuery
  }),
  request('Get Service By ID', 'GET', '/api/v1/admin/services/{serviceId}', {
    tokenVar: 'adminToken'
  }),
  request('Get Pending Services', 'GET', '/api/v1/admin/services/pending', {
    tokenVar: 'adminToken',
    query: paginationQuery
  }),
  request('Approve Service', 'PATCH', '/api/v1/admin/services/{serviceId}/approve', {
    tokenVar: 'adminToken'
  }),
  request('Reject Service', 'PATCH', '/api/v1/admin/services/{serviceId}/reject', {
    tokenVar: 'adminToken'
  })
]);

const adminBookings = folder('Bookings', [
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'adminToken'
  }),
  request('Approve Booking', 'PATCH', '/api/v1/bookings/{bookingId}/approve', {
    tokenVar: 'adminToken'
  }),
  request('Reject Booking', 'PATCH', '/api/v1/bookings/{bookingId}/reject', {
    tokenVar: 'adminToken',
    contentType: 'application/json',
    body: jsonBody({
      reason: 'Admin moderation rejection.'
    })
  })
]);

const superAdminAuth = folder('Auth', [
  request('Login Admin Or Super Admin', 'POST', '/api/v1/auth/admin/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'superadmin@example.com',
      password: 'StrongSuperAdminPass123'
    })
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'superAdminToken'
  })
]);

const superAdminAdminUsers = folder('Admin Users', [
  request('Create Admin User', 'POST', '/api/v1/admin/admin-users', {
    tokenVar: 'superAdminToken',
    contentType: 'application/json',
    body: jsonBody({
      fullName: 'Admin Example',
      email: 'new.admin@example.com',
      password: 'StrongAdminPass123'
    })
  }),
  request('Block Admin User', 'PATCH', '/api/v1/admin/admin-users/{adminUserId}/block', {
    tokenVar: 'superAdminToken'
  }),
  request('Unblock Admin User', 'PATCH', '/api/v1/admin/admin-users/{adminUserId}/unblock', {
    tokenVar: 'superAdminToken'
  })
]);

const superAdminModeration = folder('Moderation', [
  request('Get All Venues', 'GET', '/api/v1/admin/venues', {
    tokenVar: 'superAdminToken',
    query: paginationQuery
  }),
  request('Get Venue By ID', 'GET', '/api/v1/admin/venues/{venueId}', {
    tokenVar: 'superAdminToken'
  }),
  request('Get Pending Venues', 'GET', '/api/v1/admin/venues/pending', {
    tokenVar: 'superAdminToken',
    query: paginationQuery
  }),
  request('Approve Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/approve', {
    tokenVar: 'superAdminToken'
  }),
  request('Reject Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/reject', {
    tokenVar: 'superAdminToken'
  }),
  request('Get All Services', 'GET', '/api/v1/admin/services', {
    tokenVar: 'superAdminToken',
    query: paginationQuery
  }),
  request('Get Service By ID', 'GET', '/api/v1/admin/services/{serviceId}', {
    tokenVar: 'superAdminToken'
  }),
  request('Get Pending Services', 'GET', '/api/v1/admin/services/pending', {
    tokenVar: 'superAdminToken',
    query: paginationQuery
  }),
  request('Approve Service', 'PATCH', '/api/v1/admin/services/{serviceId}/approve', {
    tokenVar: 'superAdminToken'
  }),
  request('Reject Service', 'PATCH', '/api/v1/admin/services/{serviceId}/reject', {
    tokenVar: 'superAdminToken'
  })
]);

const superAdminBookings = folder('Bookings', [
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'superAdminToken'
  }),
  request('Approve Booking', 'PATCH', '/api/v1/bookings/{bookingId}/approve', {
    tokenVar: 'superAdminToken'
  }),
  request('Reject Booking', 'PATCH', '/api/v1/bookings/{bookingId}/reject', {
    tokenVar: 'superAdminToken',
    contentType: 'application/json',
    body: jsonBody({
      reason: 'Super admin moderation rejection.'
    })
  })
]);

const publicApis = folder('Public', [
  request('Root Status', 'GET', '/'),
  request('Health Check', 'GET', '/health'),
  request('Get Published Services', 'GET', '/api/v1/public/services', {
    query: paginationQuery
  }),
  request('Get Published Service By ID', 'GET', '/api/v1/public/services/{serviceId}'),
  request('Get Published Venues', 'GET', '/api/v1/public/venues', {
    query: paginationQuery
  }),
  request('Get Published Venue By ID', 'GET', '/api/v1/public/venues/{venueId}'),
  request('Get Public Event Planners', 'GET', '/api/v1/public/event-planners', {
    query: paginationQuery
  }),
  request('Get Public Event Planner By ID', 'GET', '/api/v1/public/event-planners/{eventPlannerId}'),
  request('Get Event Planners', 'GET', '/api/v1/event-planners', {
    query: paginationQuery
  }),
  request('Get Published Services Under Provider Namespace', 'GET', '/api/v1/service-provider/services', {
    query: paginationQuery
  }),
  request(
    'Get Published Service By ID Under Provider Namespace',
    'GET',
    '/api/v1/service-provider/services/{serviceId}'
  ),
  request('Get Published Venues Under Provider Namespace', 'GET', '/api/v1/venue-provider/venues', {
    query: paginationQuery
  }),
  request('Get Published Venue By ID Under Provider Namespace', 'GET', '/api/v1/venue-provider/venues/{venueId}')
]);

const collection = {
  info: {
    name: 'EvenIt Backend API',
    _postman_id: '5c8101ec-a729-4b09-8d9a-1c8d4b5bb205',
    description:
      'Role-based Apidog/Postman collection for EvenIt backend. Each folder groups register, login, onboarding, and role-specific APIs.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: variables,
  item: [
    publicApis,
    folder('Customer', [customerAuth, customerBookings, customerSubscriptions]),
    folder('Service Provider', [
      serviceProviderAuth,
      serviceProviderServices,
      serviceProviderUploads,
      serviceProviderBookings,
      serviceProviderSubscriptions
    ]),
    folder('Venue Provider', [
      venueProviderAuth,
      venueProviderVenues,
      venueProviderUploads,
      venueProviderBookings,
      venueProviderSubscriptions
    ]),
    folder('Event Planner', [
      eventPlannerAuth,
      eventPlannerPublic,
      eventPlannerUploads,
      eventPlannerBookings,
      eventPlannerSubscriptions
    ]),
    folder('Admin', [adminAuth, adminModeration, adminBookings]),
    folder('Super Admin', [superAdminAuth, superAdminAdminUsers, superAdminModeration, superAdminBookings])
  ]
};

fs.writeFileSync(COLLECTION_PATH, `${JSON.stringify(collection, null, 2)}\n`);
console.log(`Wrote ${COLLECTION_PATH}`);

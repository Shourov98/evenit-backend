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
  { key: 'adminUserId', value: '' },
  { key: 'customerId', value: '' },
  { key: 'serviceProviderId', value: '' },
  { key: 'venueProviderId', value: '' },
  { key: 'customerUserId', value: '' },
  { key: 'serviceProviderUserId', value: '' },
  { key: 'venueProviderUserId', value: '' },
  { key: 'eventPlannerUserId', value: '' },
  { key: 'adminUserSelfId', value: '' },
  { key: 'superAdminUserSelfId', value: '' }
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

const testEvent = (lines) => [
  {
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: lines
    }
  }
];

const tokenCaptureEvent = (variableName) =>
  testEvent([
    'const json = pm.response.json();',
    'const token = json?.data?.token;',
    `if (token) pm.collectionVariables.set('${variableName}', token);`
  ]);

const idCaptureEvent = (variableName) =>
  testEvent([
    'const json = pm.response.json();',
    'const data = json?.data;',
    'const firstItem = Array.isArray(data) ? data[0] : null;',
    'const id = data?._id || data?.id || data?.user?.id || firstItem?._id || firstItem?.id || null;',
    `if (id) pm.collectionVariables.set('${variableName}', String(id));`
  ]);

const request = (name, method, endpoint, options = {}) => ({
  name,
  request: {
    method,
    ...(options.description ? { description: options.description } : {}),
    ...(buildHeaders(options).length ? { header: buildHeaders(options) } : {}),
    ...(options.body ? { body: options.body } : {}),
    url: buildUrl(endpoint, options.query || [])
  },
  ...(options.event ? { event: options.event } : {})
});

const folder = (name, items) => ({ name, item: items });

const paginationQuery = [
  { key: 'page', value: '1' },
  { key: 'limit', value: '10' },
  { key: 'sortBy', value: 'createdAt' },
  { key: 'sortOrder', value: 'desc' }
];

const bookingListQuery = [...paginationQuery, { key: 'status', value: 'pending' }];

const buildOrderChatFolder = (tokenVar, actorLabel) =>
  folder('Order Chat', [
    request(`Get ${actorLabel} Order Chat Messages`, 'GET', '/api/v1/order-chats/{bookingId}/messages', {
      tokenVar,
      query: [
        { key: 'page', value: '1' },
        { key: 'limit', value: '50' }
      ]
    }),
    request(`Send ${actorLabel} Order Chat Message`, 'POST', '/api/v1/order-chats/{bookingId}/messages', {
      tokenVar,
      contentType: 'application/json',
      body: jsonBody({
        content: 'Hello, I want to confirm the booking details.'
      })
    })
  ]);

const buildProfileImageUploadRequest = (tokenVar, actorLabel) =>
  request(`Upload ${actorLabel} Profile Image`, 'POST', '/api/v1/uploads/profile-image', {
    tokenVar,
    description:
      'Multipart/form-data request. Attach the new profile image file in the `image` field.',
    body: formDataBody([
      {
        key: 'image',
        type: 'file',
        src: [],
        description: 'Attach one image file for the authenticated user profile.'
      }
    ])
  });

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
    }),
    event: tokenCaptureEvent('customerToken')
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
    tokenVar: 'customerToken',
    event: idCaptureEvent('customerUserId')
  }),
  request('Update Customer Profile', 'PATCH', '/api/v1/auth/profile', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    description:
      'Updates only common customer account fields. There is no common phone field in the backend user model.',
    body: jsonBody({
      fullName: 'Customer Example Updated',
      email: 'customer.updated@example.com'
    })
  }),
  buildProfileImageUploadRequest('customerToken', 'Customer')
]);

const serviceProviderProfileUpdateBody = {
  fullName: 'Service Provider Example Updated',
  email: 'service.provider.updated@example.com',
  serviceCategories: ['Catering', 'Decoration'],
  serviceProvider: {
    profileInfo: {
      nidOrTradeLicenseNumber: 'SP-987654321',
      serviceName: 'Premium Catering Plus',
      serviceCategory: 'Catering',
      serviceDescription: 'Updated service description for premium events.',
      coverageArea: ['Dhaka', 'Gazipur', 'Narayanganj'],
      verification: {
        businessType: 'company',
        companyName: 'Service Provider Example Ltd',
        nationalIdOrTradeLicenseFiles: [
          'https://example.com/service-provider/trade-license.pdf'
        ]
      }
    },
    services: ['Buffet', 'Corporate Events', 'Wedding Catering']
  }
};

const eventPlannerProfileUpdateBody = {
  fullName: 'Event Planner Example Updated',
  email: 'event.planner.updated@example.com',
  eventPlanner: {
    profileInfo: {
      nidOrTradeLicenseNumber: 'EP-987654321',
      name: 'Event Planner Example Pro',
      description: 'Updated planner description for weddings and corporate events.',
      coverageArea: ['Dhaka', 'Chattogram', 'Sylhet'],
      address: 'Gulshan, Dhaka',
      verification: {
        businessType: 'company',
        companyName: 'Event Planner Example Ltd',
        nationalIdOrTradeLicenseFiles: [
          'https://example.com/event-planner/trade-license.pdf'
        ]
      }
    }
  }
};

const venueProviderProfileUpdateBody = {
  fullName: 'Venue Provider Example Updated',
  email: 'venue.provider.updated@example.com',
  venueProvider: {
    profileInfo: {
      nidOrTradeLicenseNumber: 'VP-987654321',
      businessName: 'Royal Hall Premium',
      businessType: 'company',
      legalBusinessName: 'Royal Hall Premium Ltd',
      registrationNo: 'TR-654321',
      businessMail: 'business.updated@royalhall.com',
      businessPhoneNo: '+8801711111111',
      nationalIdOrTradeLicenseFiles: [
        'https://example.com/venue-provider/trade-license.pdf'
      ]
    }
  }
};

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
    }),
    event: idCaptureEvent('bookingId')
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
    }),
    event: idCaptureEvent('bookingId')
  }),
  request('Create Venue Booking', 'POST', '/api/v1/bookings/venues/{venueId}', {
    tokenVar: 'customerToken',
    contentType: 'application/json',
    body: jsonBody({
      bookingDate: '2026-04-15',
      timeSlots: ['14:00', '15:00', '16:00'],
      durationHours: 3,
      specialInstructions: 'Need projector and stage.'
    }),
    event: idCaptureEvent('bookingId')
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
    }),
    event: idCaptureEvent('bookingId')
  }),
  request('Get My Bookings', 'GET', '/api/v1/bookings/my', {
    tokenVar: 'customerToken',
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
  }),
  request('Get Booking By ID', 'GET', '/api/v1/bookings/{bookingId}', {
    tokenVar: 'customerToken'
  }),
  request('Cancel Booking', 'PATCH', '/api/v1/bookings/{bookingId}/cancel', {
    tokenVar: 'customerToken'
  })
]);

const customerSubscriptions = folder('Subscriptions', [
  request('Get Subscription Status', 'GET', '/api/v1/subscriptions/status', {
    tokenVar: 'customerToken'
  }),
  request('Get Subscription Payment Link', 'GET', '/api/v1/subscriptions/payment-link', {
    tokenVar: 'customerToken'
  })
]);

const customerOrderChat = buildOrderChatFolder('customerToken', 'Customer');

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
    }),
    event: tokenCaptureEvent('serviceProviderToken')
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
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify({
          _id: '65f1a9d0f1b2c3d4e5f60001',
          name: 'Service Provider Example',
          email: 'service.provider@example.com',
          profileInfo: {
            nidOrTradeLicenseNumber: '1234567890123',
            serviceName: 'Premium Catering',
            serviceCategory: 'Catering',
            serviceDescription: 'Corporate and wedding catering services',
            coverageArea: ['Dhaka', 'Gazipur'],
            verification: {
              businessType: 'individual'
            }
          },
          services: []
        }, null, 2)
      },
      {
        key: 'nationalIdOrTradeLicenseFiles',
        type: 'file',
        src: [],
        description: 'Attach one or more image/PDF files from the frontend file picker.'
      }
    ])
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'serviceProviderToken',
    event: idCaptureEvent('serviceProviderUserId')
  }),
  request('Update Service Provider Profile', 'PATCH', '/api/v1/auth/profile', {
    tokenVar: 'serviceProviderToken',
    contentType: 'application/json',
    description:
      'Updates common service provider account fields plus service categories and onboarding.serviceProvider profile data.',
    body: jsonBody(serviceProviderProfileUpdateBody)
  }),
  buildProfileImageUploadRequest('serviceProviderToken', 'Service Provider')
]);

const serviceProviderServices = folder('Services', [
  request('Get My Services', 'GET', '/api/v1/service-provider/my-services', {
    tokenVar: 'serviceProviderToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Get My Pending Services', 'GET', '/api/v1/service-provider/my-services', {
    tokenVar: 'serviceProviderToken',
    query: [...paginationQuery, { key: 'publishStatus', value: 'pending' }],
    event: idCaptureEvent('serviceId')
  }),
  request('Get My Published Services', 'GET', '/api/v1/service-provider/my-services', {
    tokenVar: 'serviceProviderToken',
    query: [...paginationQuery, { key: 'publishStatus', value: 'published' }],
    event: idCaptureEvent('serviceId')
  }),
  request('Get Published Services (Public)', 'GET', '/api/v1/service-provider/services', {
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Get Published Service By ID (Public)', 'GET', '/api/v1/service-provider/services/{serviceId}', {
    event: idCaptureEvent('serviceId')
  }),
  request('Create Service', 'POST', '/api/v1/service-provider/services', {
    tokenVar: 'serviceProviderToken',
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify(
          {
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
              galleryImages: [],
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
          },
          null,
          2
        ),
        description: 'JSON string payload. The backend uploads attached files and appends the returned URLs to media.galleryImages.'
      },
      {
        key: 'images',
        type: 'file',
        src: [],
        description: 'Attach one or more service images from the frontend file picker.'
      },
      {
        key: 'image',
        type: 'file',
        src: [],
        description: 'Optional single-image field supported for client compatibility.'
      }
    ]),
    event: idCaptureEvent('serviceId')
  }),
  request('Update Service', 'PATCH', '/api/v1/service-provider/services/{serviceId}', {
    tokenVar: 'serviceProviderToken',
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify(
          {
            pricing: {
              amount: 45000,
              discount: {
                type: 'fixed',
                value: 5000
              }
            },
            media: {
              galleryImages: [],
              videoUrl: 'https://youtube.com/watch?v=updated-service'
            },
            availabilityOverrides: [
              {
                date: '2026-04-13',
                slots: [{ hour: 12, status: 'booked' }]
              }
            ]
          },
          null,
          2
        ),
        description: 'JSON string payload. The backend uploads attached files and appends the returned URLs to media.galleryImages.'
      },
      {
        key: 'images',
        type: 'file',
        src: [],
        description: 'Attach one or more service images from the frontend file picker.'
      },
      {
        key: 'image',
        type: 'file',
        src: [],
        description: 'Optional single-image field supported for client compatibility.'
      }
    ])
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
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
  }),
  request('Get Service Provider Booking Requests', 'GET', '/api/v1/bookings/service-provider', {
    tokenVar: 'serviceProviderToken',
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
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
  request('Get Subscription Status', 'GET', '/api/v1/subscriptions/status', {
    tokenVar: 'serviceProviderToken'
  }),
  request('Get Subscription Payment Link', 'GET', '/api/v1/subscriptions/payment-link', {
    tokenVar: 'serviceProviderToken'
  })
]);

const serviceProviderOrderChat = buildOrderChatFolder('serviceProviderToken', 'Service Provider');

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
    }),
    event: tokenCaptureEvent('venueProviderToken')
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
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify({
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
        }, null, 2)
      },
      {
        key: 'nationalIdOrTradeLicenseFiles',
        type: 'file',
        src: [],
        description: 'Optional image/PDF document files for trade license or NID.'
      }
    ])
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'venueProviderToken',
    event: idCaptureEvent('venueProviderUserId')
  }),
  request('Update Venue Provider Profile', 'PATCH', '/api/v1/auth/profile', {
    tokenVar: 'venueProviderToken',
    contentType: 'application/json',
    description:
      'Updates common venue provider account fields plus onboarding.venueProvider profile data, including businessPhoneNo.',
    body: jsonBody(venueProviderProfileUpdateBody)
  }),
  buildProfileImageUploadRequest('venueProviderToken', 'Venue Provider')
]);

const venueProviderVenues = folder('Venues', [
  request('Get My Venues', 'GET', '/api/v1/venue-provider/my-venues', {
    tokenVar: 'venueProviderToken',
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Get My Pending Venues', 'GET', '/api/v1/venue-provider/my-venues', {
    tokenVar: 'venueProviderToken',
    query: [...paginationQuery, { key: 'publishStatus', value: 'pending' }],
    event: idCaptureEvent('venueId')
  }),
  request('Get My Published Venues', 'GET', '/api/v1/venue-provider/my-venues', {
    tokenVar: 'venueProviderToken',
    query: [...paginationQuery, { key: 'publishStatus', value: 'published' }],
    event: idCaptureEvent('venueId')
  }),
  request('Get Published Venues (Public)', 'GET', '/api/v1/venue-provider/venues', {
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Get Published Venue By ID (Public)', 'GET', '/api/v1/venue-provider/venues/{venueId}', {
    event: idCaptureEvent('venueId')
  }),
  request('Create Venue', 'POST', '/api/v1/venue-provider/venues', {
    tokenVar: 'venueProviderToken',
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify(
          {
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
              galleryImages: [],
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
          },
          null,
          2
        ),
        description: 'JSON string payload. The backend uploads attached files and appends the returned URLs to media.galleryImages.'
      },
      {
        key: 'images',
        type: 'file',
        src: [],
        description: 'Attach one or more venue images from the frontend file picker.'
      },
      {
        key: 'image',
        type: 'file',
        src: [],
        description: 'Optional single-image field supported for client compatibility.'
      }
    ]),
    event: idCaptureEvent('venueId')
  }),
  request('Update Venue', 'PATCH', '/api/v1/venue-provider/venues/{venueId}', {
    tokenVar: 'venueProviderToken',
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify(
          {
            capacity: {
              maximumGuests: 550
            },
            media: {
              galleryImages: [],
              videoUrl: 'https://youtube.com/watch?v=updated-venue'
            },
            availabilityOverrides: [
              {
                date: '2026-04-19',
                slots: [{ hour: 18, status: 'booked' }]
              }
            ]
          },
          null,
          2
        ),
        description: 'JSON string payload. The backend uploads attached files and appends the returned URLs to media.galleryImages.'
      },
      {
        key: 'images',
        type: 'file',
        src: [],
        description: 'Attach one or more venue images from the frontend file picker.'
      },
      {
        key: 'image',
        type: 'file',
        src: [],
        description: 'Optional single-image field supported for client compatibility.'
      }
    ])
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
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
  }),
  request('Get Venue Provider Booking Requests', 'GET', '/api/v1/bookings/venue-provider', {
    tokenVar: 'venueProviderToken',
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
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
  request('Get Subscription Status', 'GET', '/api/v1/subscriptions/status', {
    tokenVar: 'venueProviderToken'
  }),
  request('Get Subscription Payment Link', 'GET', '/api/v1/subscriptions/payment-link', {
    tokenVar: 'venueProviderToken'
  })
]);

const venueProviderOrderChat = buildOrderChatFolder('venueProviderToken', 'Venue Provider');

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
    }),
    event: tokenCaptureEvent('eventPlannerToken')
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
    body: formDataBody([
      {
        key: 'payload',
        value: JSON.stringify({
          _id: '65f1a9d0f1b2c3d4e5f60002',
          fullName: 'Event Planner Example',
          email: 'event.planner@example.com',
          profileInfo: {
            nidOrTradeLicenseNumber: '1234567890123',
            name: 'Event Planner Example',
            description: 'Wedding and corporate event planning',
            coverageArea: ['Dhaka', 'Chattogram'],
            address: 'Banani, Dhaka',
            verification: {
              businessType: 'company',
              companyName: 'Events Ltd'
            }
          }
        }, null, 2)
      },
      {
        key: 'nationalIdOrTradeLicenseFiles',
        type: 'file',
        src: [],
        description: 'Attach one or more image/PDF files from the frontend file picker.'
      }
    ])
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'eventPlannerToken',
    event: idCaptureEvent('eventPlannerUserId')
  }),
  request('Update Event Planner Profile', 'PATCH', '/api/v1/auth/profile', {
    tokenVar: 'eventPlannerToken',
    contentType: 'application/json',
    description:
      'Updates common event planner account fields plus onboarding.eventProvider profile data.',
    body: jsonBody(eventPlannerProfileUpdateBody)
  }),
  buildProfileImageUploadRequest('eventPlannerToken', 'Event Planner')
]);

const eventPlannerPublic = folder('Public APIs', [
  request('Get Event Planners (Public)', 'GET', '/api/v1/event-planners', {
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Public Event Planners', 'GET', '/api/v1/public/event-planners', {
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Public Event Planner By ID', 'GET', '/api/v1/public/event-planners/{eventPlannerId}', {
    event: idCaptureEvent('eventPlannerId')
  })
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
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
  }),
  request('Get Event Planner Booking Requests', 'GET', '/api/v1/bookings/event-planner', {
    tokenVar: 'eventPlannerToken',
    query: bookingListQuery,
    event: idCaptureEvent('bookingId')
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
  request('Get Subscription Status', 'GET', '/api/v1/subscriptions/status', {
    tokenVar: 'eventPlannerToken'
  }),
  request('Get Subscription Payment Link', 'GET', '/api/v1/subscriptions/payment-link', {
    tokenVar: 'eventPlannerToken'
  })
]);

const eventPlannerOrderChat = buildOrderChatFolder('eventPlannerToken', 'Event Planner');

const adminAuth = folder('Auth', [
  request('Login Admin Or Super Admin', 'POST', '/api/v1/auth/admin/login', {
    contentType: 'application/json',
    body: jsonBody({
      email: 'admin@example.com',
      password: 'StrongAdminPass123'
    }),
    event: tokenCaptureEvent('adminToken')
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('adminUserSelfId')
  })
]);

const adminModeration = folder('Moderation', [
  request('Get All Venues', 'GET', '/api/v1/admin/venues', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Get Venue By ID', 'GET', '/api/v1/admin/venues/{venueId}', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('venueId')
  }),
  request('Get Pending Venues', 'GET', '/api/v1/admin/venues/pending', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Approve Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/approve', {
    tokenVar: 'adminToken'
  }),
  request('Reject Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/reject', {
    tokenVar: 'adminToken'
  }),
  request('Get All Services', 'GET', '/api/v1/admin/services', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Get Service By ID', 'GET', '/api/v1/admin/services/{serviceId}', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('serviceId')
  }),
  request('Get Pending Services', 'GET', '/api/v1/admin/services/pending', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Approve Service', 'PATCH', '/api/v1/admin/services/{serviceId}/approve', {
    tokenVar: 'adminToken'
  }),
  request('Reject Service', 'PATCH', '/api/v1/admin/services/{serviceId}/reject', {
    tokenVar: 'adminToken'
  })
]);

const adminUsers = folder('Users', [
  request('Get All Customers', 'GET', '/api/v1/admin/customers', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('customerId')
  }),
  request('Get Blocked Customers', 'GET', '/api/v1/admin/customers/blocked', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('customerId')
  }),
  request('Get Customer By ID', 'GET', '/api/v1/admin/customers/{customerId}', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('customerId')
  }),
  request('Block Customer', 'PATCH', '/api/v1/admin/customers/{customerId}/block', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('customerId')
  }),
  request('Unblock Customer', 'PATCH', '/api/v1/admin/customers/{customerId}/unblock', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('customerId')
  }),
  request('Get All Service Providers', 'GET', '/api/v1/admin/service-providers', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Get Blocked Service Providers', 'GET', '/api/v1/admin/service-providers/blocked', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Get Service Provider By ID', 'GET', '/api/v1/admin/service-providers/{serviceProviderId}', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Block Service Provider', 'PATCH', '/api/v1/admin/service-providers/{serviceProviderId}/block', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Unblock Service Provider', 'PATCH', '/api/v1/admin/service-providers/{serviceProviderId}/unblock', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Get All Venue Providers', 'GET', '/api/v1/admin/venue-providers', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueProviderId')
  }),
  request('Get Blocked Venue Providers', 'GET', '/api/v1/admin/venue-providers/blocked', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueProviderId')
  }),
  request('Get Venue Provider By ID', 'GET', '/api/v1/admin/venue-providers/{venueProviderId}', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('venueProviderId')
  }),
  request('Block Venue Provider', 'PATCH', '/api/v1/admin/venue-providers/{venueProviderId}/block', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('venueProviderId')
  }),
  request('Unblock Venue Provider', 'PATCH', '/api/v1/admin/venue-providers/{venueProviderId}/unblock', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('venueProviderId')
  }),
  request('Get All Event Planners', 'GET', '/api/v1/admin/event-planners', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Blocked Event Planners', 'GET', '/api/v1/admin/event-planners/blocked', {
    tokenVar: 'adminToken',
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Event Planner By ID', 'GET', '/api/v1/admin/event-planners/{eventPlannerId}', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Block Event Planner', 'PATCH', '/api/v1/admin/event-planners/{eventPlannerId}/block', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Unblock Event Planner', 'PATCH', '/api/v1/admin/event-planners/{eventPlannerId}/unblock', {
    tokenVar: 'adminToken',
    event: idCaptureEvent('eventPlannerId')
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
    }),
    event: tokenCaptureEvent('superAdminToken')
  }),
  request('Get Current User', 'GET', '/api/v1/auth/me', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('superAdminUserSelfId')
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
    }),
    event: idCaptureEvent('adminUserId')
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
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Get Venue By ID', 'GET', '/api/v1/admin/venues/{venueId}', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('venueId')
  }),
  request('Get Pending Venues', 'GET', '/api/v1/admin/venues/pending', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Approve Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/approve', {
    tokenVar: 'superAdminToken'
  }),
  request('Reject Venue', 'PATCH', '/api/v1/admin/venues/{venueId}/reject', {
    tokenVar: 'superAdminToken'
  }),
  request('Get All Services', 'GET', '/api/v1/admin/services', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Get Service By ID', 'GET', '/api/v1/admin/services/{serviceId}', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('serviceId')
  }),
  request('Get Pending Services', 'GET', '/api/v1/admin/services/pending', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Approve Service', 'PATCH', '/api/v1/admin/services/{serviceId}/approve', {
    tokenVar: 'superAdminToken'
  }),
  request('Reject Service', 'PATCH', '/api/v1/admin/services/{serviceId}/reject', {
    tokenVar: 'superAdminToken'
  })
]);

const superAdminUsers = folder('Users', [
  request('Get All Customers', 'GET', '/api/v1/admin/customers', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('customerId')
  }),
  request('Get Blocked Customers', 'GET', '/api/v1/admin/customers/blocked', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('customerId')
  }),
  request('Get Customer By ID', 'GET', '/api/v1/admin/customers/{customerId}', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('customerId')
  }),
  request('Block Customer', 'PATCH', '/api/v1/admin/customers/{customerId}/block', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('customerId')
  }),
  request('Unblock Customer', 'PATCH', '/api/v1/admin/customers/{customerId}/unblock', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('customerId')
  }),
  request('Get All Service Providers', 'GET', '/api/v1/admin/service-providers', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Get Blocked Service Providers', 'GET', '/api/v1/admin/service-providers/blocked', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Get Service Provider By ID', 'GET', '/api/v1/admin/service-providers/{serviceProviderId}', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Block Service Provider', 'PATCH', '/api/v1/admin/service-providers/{serviceProviderId}/block', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Unblock Service Provider', 'PATCH', '/api/v1/admin/service-providers/{serviceProviderId}/unblock', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('serviceProviderId')
  }),
  request('Get All Venue Providers', 'GET', '/api/v1/admin/venue-providers', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueProviderId')
  }),
  request('Get Blocked Venue Providers', 'GET', '/api/v1/admin/venue-providers/blocked', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('venueProviderId')
  }),
  request('Get Venue Provider By ID', 'GET', '/api/v1/admin/venue-providers/{venueProviderId}', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('venueProviderId')
  }),
  request('Block Venue Provider', 'PATCH', '/api/v1/admin/venue-providers/{venueProviderId}/block', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('venueProviderId')
  }),
  request('Unblock Venue Provider', 'PATCH', '/api/v1/admin/venue-providers/{venueProviderId}/unblock', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('venueProviderId')
  }),
  request('Get All Event Planners', 'GET', '/api/v1/admin/event-planners', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Blocked Event Planners', 'GET', '/api/v1/admin/event-planners/blocked', {
    tokenVar: 'superAdminToken',
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Event Planner By ID', 'GET', '/api/v1/admin/event-planners/{eventPlannerId}', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Block Event Planner', 'PATCH', '/api/v1/admin/event-planners/{eventPlannerId}/block', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Unblock Event Planner', 'PATCH', '/api/v1/admin/event-planners/{eventPlannerId}/unblock', {
    tokenVar: 'superAdminToken',
    event: idCaptureEvent('eventPlannerId')
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
    description:
      'Public GET endpoint. No request body. Use query params for pagination and sorting. Returns published services only.',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request('Get Published Service By ID', 'GET', '/api/v1/public/services/{serviceId}', {
    description: 'Public GET endpoint. No request body. Returns one published service by id.',
    event: idCaptureEvent('serviceId')
  }),
  request('Get Published Venues', 'GET', '/api/v1/public/venues', {
    description:
      'Public GET endpoint. No request body. Use query params for pagination and sorting. Returns published venues only.',
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Get Published Venue By ID', 'GET', '/api/v1/public/venues/{venueId}', {
    description: 'Public GET endpoint. No request body. Returns one published venue by id.',
    event: idCaptureEvent('venueId')
  }),
  request('Get Public Event Planners', 'GET', '/api/v1/public/event-planners', {
    description:
      'Public GET endpoint. No request body. Use query params for pagination and sorting. Returns verified event planners only.',
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Public Event Planner By ID', 'GET', '/api/v1/public/event-planners/{eventPlannerId}', {
    description: 'Public GET endpoint. No request body. Returns one verified event planner by id.',
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Event Planners', 'GET', '/api/v1/event-planners', {
    description:
      'Public GET endpoint. No request body. Use query params for pagination and sorting. Returns verified event planners only.',
    query: paginationQuery,
    event: idCaptureEvent('eventPlannerId')
  }),
  request('Get Published Services Under Provider Namespace', 'GET', '/api/v1/service-provider/services', {
    description:
      'Public GET endpoint. No request body. Use query params for pagination and sorting. Returns published services only.',
    query: paginationQuery,
    event: idCaptureEvent('serviceId')
  }),
  request(
    'Get Published Service By ID Under Provider Namespace',
    'GET',
    '/api/v1/service-provider/services/{serviceId}',
    {
      description: 'Public GET endpoint. No request body. Returns one published service by id.',
      event: idCaptureEvent('serviceId')
    }
  ),
  request('Get Published Venues Under Provider Namespace', 'GET', '/api/v1/venue-provider/venues', {
    description:
      'Public GET endpoint. No request body. Use query params for pagination and sorting. Returns published venues only.',
    query: paginationQuery,
    event: idCaptureEvent('venueId')
  }),
  request('Get Published Venue By ID Under Provider Namespace', 'GET', '/api/v1/venue-provider/venues/{venueId}', {
    description: 'Public GET endpoint. No request body. Returns one published venue by id.',
    event: idCaptureEvent('venueId')
  })
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
    folder('Customer', [customerAuth, customerBookings, customerOrderChat, customerSubscriptions]),
    folder('Service Provider', [
      serviceProviderAuth,
      serviceProviderServices,
      serviceProviderUploads,
      serviceProviderBookings,
      serviceProviderOrderChat,
      serviceProviderSubscriptions
    ]),
    folder('Venue Provider', [
      venueProviderAuth,
      venueProviderVenues,
      venueProviderUploads,
      venueProviderBookings,
      venueProviderOrderChat,
      venueProviderSubscriptions
    ]),
    folder('Event Planner', [
      eventPlannerAuth,
      eventPlannerPublic,
      eventPlannerUploads,
      eventPlannerBookings,
      eventPlannerOrderChat,
      eventPlannerSubscriptions
    ]),
    folder('Admin', [adminAuth, adminUsers, adminModeration, adminBookings]),
    folder('Super Admin', [
      superAdminAuth,
      superAdminAdminUsers,
      superAdminUsers,
      superAdminModeration,
      superAdminBookings
    ])
  ]
};

fs.writeFileSync(COLLECTION_PATH, `${JSON.stringify(collection, null, 2)}\n`);
console.log(`Wrote ${COLLECTION_PATH}`);

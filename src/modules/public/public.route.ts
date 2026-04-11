import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware';
import { PublicController } from './public.controller';
import {
  eventPlannerIdParamSchema,
  serviceIdParamSchema,
  venueIdParamSchema
} from './public.schema';

const router = Router();

router.get('/stripe-config', PublicController.getStripeConfig);

/**
 * @openapi
 * tags:
 *   - name: Public
 *     description: Public landing-page content endpoints
 * components:
 *   schemas:
 *     PublicErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Service not found
 *     PublicServiceListResponse:
 *       $ref: '#/components/schemas/ServiceListResponse'
 *     PublicServiceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ServiceEntity'
 *       example:
 *         success: true
 *         data:
 *           _id: 65f1a9d0f1b2c3d4e5f60718
 *           ownerId: 65f1a9d0f1b2c3d4e5f60011
 *           information:
 *             serviceName: Premium Catering
 *             category: Catering
 *             description: Corporate and wedding catering service.
 *             serviceArea:
 *               - Dhaka
 *               - Gazipur
 *             tags:
 *               - wedding
 *               - corporate
 *           pricing:
 *             amount: 50000
 *             pricingType: package
 *             currency: BDT
 *             discount:
 *               type: percentage
 *               value: 10
 *           settings:
 *             amenities:
 *               deliveryIncluded: true
 *               setupIncluded: true
 *               staffIncluded: false
 *             capacity: 300
 *           media:
 *             galleryImages:
 *               - https://cdn.example.com/service/image-1.jpg
 *               - https://cdn.example.com/service/image-2.jpg
 *             videoUrl: https://youtube.com/watch?v=abc123
 *           availabilityOverrides:
 *             - date: 2026-04-12
 *               slots:
 *                 - hour: 10
 *                   status: booked
 *                 - hour: 11
 *                   status: booked
 *           publishStatus: published
 *           approvedBy:
 *             name: Admin Example
 *             email: admin@example.com
 *           approvedAt: 2026-03-30T22:41:09.978Z
 *           reviews:
 *             - reviewerName: Jane Doe
 *               reviewerAvatarUrl: https://cdn.example.com/avatars/jane.jpg
 *               rating: 5
 *               comment: Excellent service and presentation.
 *               createdAt: 2026-03-29T18:30:00.000Z
 *           isDeleted: false
 *           createdAt: 2026-03-20T10:00:00.000Z
 *           updatedAt: 2026-03-30T22:41:09.978Z
 *           provider:
 *             _id: 65f1a9d0f1b2c3d4e5f60011
 *             fullName: Service Provider Example
 *             role: service_provider
 *             serviceProvider:
 *               serviceName: Premium Catering
 *               serviceCategory: Catering
 *               serviceDescription: Corporate and wedding catering services
 *               coverageArea:
 *                 - Dhaka
 *                 - Gazipur
 *     PublicVenueListResponse:
 *       $ref: '#/components/schemas/VenueListResponse'
 *     PublicVenueResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/VenueEntity'
 *       example:
 *         success: true
 *         data:
 *           _id: 65f1a9d0f1b2c3d4e5f60719
 *           ownerId: 65f1a9d0f1b2c3d4e5f60021
 *           information:
 *             venueName: Royal Hall
 *             venueType: Banquet
 *             description: Large indoor venue for weddings and corporate events.
 *             addressLine: Road 12, Dhanmondi
 *             city: Dhaka
 *             area: Dhanmondi
 *           pricing:
 *             basePrice: 120000
 *             currency: BDT
 *             discount:
 *               type: percentage
 *               value: 15
 *             amenities:
 *               parking: true
 *               airConditioned: true
 *               stage: true
 *           capacity:
 *             maximumGuests: 500
 *           media:
 *             galleryImages:
 *               - https://cdn.example.com/venue/image-1.jpg
 *               - https://cdn.example.com/venue/image-2.jpg
 *             videoUrl: https://youtube.com/watch?v=venue123
 *           availabilityOverrides:
 *             - date: 2026-04-18
 *               slots:
 *                 - hour: 14
 *                   status: booked
 *                 - hour: 15
 *                   status: booked
 *           publishStatus: published
 *           approvedBy:
 *             name: Admin Example
 *             email: admin@example.com
 *           approvedAt: 2026-03-30T22:41:09.978Z
 *           reviews:
 *             - reviewerName: John Doe
 *               reviewerAvatarUrl: https://cdn.example.com/avatars/john.jpg
 *               rating: 4
 *               comment: Spacious venue with good amenities.
 *               createdAt: 2026-03-28T12:00:00.000Z
 *           isDeleted: false
 *           createdAt: 2026-03-22T09:00:00.000Z
 *           updatedAt: 2026-03-30T22:41:09.978Z
 *           provider:
 *             _id: 65f1a9d0f1b2c3d4e5f60021
 *             fullName: Venue Provider Example
 *             role: venue_provider
 *             venueProvider:
 *               businessName: Royal Hall
 *               businessType: company
 *               legalBusinessName: Royal Hall Ltd
 *               businessMail: business@royalhall.com
 *               businessPhoneNo: +8801712345678
 *     PublicEventPlannerListResponse:
 *       $ref: '#/components/schemas/EventPlannerListResponse'
 *     PublicEventPlannerResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/EventPlannerEntity'
 *       example:
 *         success: true
 *         data:
 *           _id: 65f1a9d0f1b2c3d4e5f60077
 *           fullName: Premium Wedding & Event Planner
 *           email: planner@example.com
 *           role: event_planner
 *           serviceCategories:
 *             - wedding
 *             - corporate
 *           isEmailVerified: true
 *           onboarding:
 *             verification:
 *               businessType: company
 *               companyName: Events Ltd
 *               nationalIdOrTradeLicenseUrl: https://cdn.example.com/trade-license.pdf
 *             eventProvider:
 *               _id: 65f1a9d0f1b2c3d4e5f60077
 *               fullName: Premium Wedding & Event Planner
 *               email: planner@example.com
 *               profileInfo:
 *                 name: Premium Wedding & Event Planner
 *                 description: Wedding and corporate event planning
 *                 coverageArea:
 *                   - Dhaka
 *                   - Chattogram
 *                 address: Banani, Dhaka
 *                 verification:
 *                   businessType: company
 *                   companyName: Events Ltd
 *                   nationalIdOrTradeLicenseFiles:
 *                     - https://cdn.example.com/trade-license.pdf
 *             submittedAt: 2026-03-20T10:00:00.000Z
 *           createdAt: 2026-03-19T08:00:00.000Z
 *           updatedAt: 2026-03-30T22:41:09.978Z
 */

/**
 * @openapi
 * /api/v1/public/services:
 *   get:
 *     tags: [Public]
 *     summary: Get published services without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns only services with `publishStatus: published`."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated published services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicServiceListResponse'
 *             example:
 *               success: true
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 1
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               data:
 *                 - _id: 65f1a9d0f1b2c3d4e5f60718
 *                   ownerId: 65f1a9d0f1b2c3d4e5f60011
 *                   information:
 *                     serviceName: Premium Catering
 *                     category: Catering
 *                     description: Corporate and wedding catering service.
 *                     serviceArea:
 *                       - Dhaka
 *                       - Gazipur
 *                     tags:
 *                       - wedding
 *                       - corporate
 *                   pricing:
 *                     amount: 50000
 *                     pricingType: package
 *                     currency: BDT
 *                   settings:
 *                     amenities:
 *                       deliveryIncluded: true
 *                       setupIncluded: true
 *                     capacity: 300
 *                   media:
 *                     galleryImages:
 *                       - https://cdn.example.com/service/image-1.jpg
 *                   availabilityOverrides: []
 *                   publishStatus: published
 *                   approvedBy:
 *                     name: Admin Example
 *                     email: admin@example.com
 *                   approvedAt: 2026-03-30T22:41:09.978Z
 *                   reviews: []
 *                   isDeleted: false
 *                   createdAt: 2026-03-20T10:00:00.000Z
 *                   updatedAt: 2026-03-30T22:41:09.978Z
 *                   provider:
 *                     _id: 65f1a9d0f1b2c3d4e5f60011
 *                     fullName: Service Provider Example
 *                     role: service_provider
 *       400:
 *         description: Invalid pagination or sorting query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get('/services', PublicController.getPublishedServices);

/**
 * @openapi
 * /api/v1/public/services/{serviceId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one published service without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns one published service by id."
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published service details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicServiceResponse'
 *       400:
 *         description: Invalid service id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get(
  '/services/:serviceId',
  validate(serviceIdParamSchema),
  PublicController.getPublishedServiceById
);

/**
 * @openapi
 * /api/v1/public/venues:
 *   get:
 *     tags: [Public]
 *     summary: Get published venues without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns only venues with `publishStatus: published`."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated published venues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicVenueListResponse'
 *             example:
 *               success: true
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 1
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               data:
 *                 - _id: 65f1a9d0f1b2c3d4e5f60719
 *                   ownerId: 65f1a9d0f1b2c3d4e5f60021
 *                   information:
 *                     venueName: Royal Hall
 *                     venueType: Banquet
 *                     description: Large indoor venue for weddings and corporate events.
 *                     addressLine: Road 12, Dhanmondi
 *                     city: Dhaka
 *                     area: Dhanmondi
 *                   pricing:
 *                     basePrice: 120000
 *                     currency: BDT
 *                     amenities:
 *                       parking: true
 *                       airConditioned: true
 *                   capacity:
 *                     maximumGuests: 500
 *                   media:
 *                     galleryImages:
 *                       - https://cdn.example.com/venue/image-1.jpg
 *                   availabilityOverrides: []
 *                   publishStatus: published
 *                   approvedBy:
 *                     name: Admin Example
 *                     email: admin@example.com
 *                   approvedAt: 2026-03-30T22:41:09.978Z
 *                   reviews: []
 *                   isDeleted: false
 *                   createdAt: 2026-03-22T09:00:00.000Z
 *                   updatedAt: 2026-03-30T22:41:09.978Z
 *                   provider:
 *                     _id: 65f1a9d0f1b2c3d4e5f60021
 *                     fullName: Venue Provider Example
 *                     role: venue_provider
 *       400:
 *         description: Invalid pagination or sorting query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get('/venues', PublicController.getPublishedVenues);

/**
 * @openapi
 * /api/v1/public/venues/{venueId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one published venue without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns one published venue by id."
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Published venue details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicVenueResponse'
 *       400:
 *         description: Invalid venue id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 *       404:
 *         description: Venue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get(
  '/venues/:venueId',
  validate(venueIdParamSchema),
  PublicController.getPublishedVenueById
);

/**
 * @openapi
 * /api/v1/public/event-planners:
 *   get:
 *     tags: [Public]
 *     summary: Get public event planners without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns verified event planners who completed event planner onboarding."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated event planners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicEventPlannerListResponse'
 *             example:
 *               success: true
 *               meta:
 *                 page: 1
 *                 limit: 10
 *                 total: 1
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *               data:
 *                 - _id: 65f1a9d0f1b2c3d4e5f60077
 *                   fullName: Premium Wedding & Event Planner
 *                   email: planner@example.com
 *                   role: event_planner
 *                   serviceCategories:
 *                     - wedding
 *                     - corporate
 *                   isEmailVerified: true
 *                   onboarding:
 *                     eventProvider:
 *                       profileInfo:
 *                         name: Premium Wedding & Event Planner
 *                         coverageArea:
 *                           - Dhaka
 *                           - Chattogram
 *                   createdAt: 2026-03-19T08:00:00.000Z
 *                   updatedAt: 2026-03-30T22:41:09.978Z
 *       400:
 *         description: Invalid pagination or sorting query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get('/event-planners', PublicController.getPublishedEventPlanners);

/**
 * @openapi
 * /api/v1/public/event-planners/{eventPlannerId}:
 *   get:
 *     tags: [Public]
 *     summary: Get one event planner without authentication
 *     description: "Public read-only endpoint. No request body is accepted. Returns one event planner by id."
 *     parameters:
 *       - in: path
 *         name: eventPlannerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event planner details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicEventPlannerResponse'
 *       400:
 *         description: Invalid event planner id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 *       404:
 *         description: Event planner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicErrorResponse'
 */
router.get(
  '/event-planners/:eventPlannerId',
  validate(eventPlannerIdParamSchema),
  PublicController.getPublishedEventPlannerById
);

export const publicRouter = router;

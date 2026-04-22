import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { parseMultipartJsonBody } from '../../common/middlewares/multipart-json.middleware';
import { imageUpload } from '../../common/middlewares/upload.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { VenueProviderController } from './venue-provider.controller';
import {
  createVenueSchema,
  ownVenuesQuerySchema,
  updateVenueSchema,
  updateVenueAvailabilitySchema,
  venueAvailabilityQuerySchema,
  venueIdParamSchema
} from './venue-provider.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: VenueProvider
 *     description: Public listing and provider management for venues
 * components:
 *   schemas:
 *     VenueAvailabilityCalendarEntry:
 *       type: object
 *       required: [date, hours]
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: 2026-03-20
 *         hours:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 8
 *             maximum: 23
 *           example:
 *             - 8
 *             - 9
 *             - 10
 *     VenueCreateRequest:
 *       type: object
 *       required: [information, pricing, capacity, media]
 *       example:
 *         information:
 *           venueName: Grand Hall
 *           venueType: Banquet
 *           description: Premium event venue in central Dhaka.
 *           addressLine: 123 Main Road
 *           city: Dhaka
 *           area: Farmgate
 *         pricing:
 *           pricePerPerson: 5000
 *           currency: BDT
 *           discount:
 *             type: percentage
 *             value: 10
 *           amenities:
 *             wifi: true
 *             parking: true
 *             ac: true
 *             catering: false
 *             audioVideo: true
 *             security: true
 *             accessible: false
 *             soundSystem: true
 *         capacity:
 *           maximumGuests: 300
 *         media:
 *           galleryImages:
 *             - https://cdn.example.com/venues/grand-hall-1.jpg
 *             - https://cdn.example.com/venues/grand-hall-2.jpg
 *           videoUrl: https://www.youtube.com/watch?v=abc123
 *         availabilityCalendar:
 *           - date: 2026-03-20
 *             hours: [8, 9, 10]
 *       properties:
 *         information:
 *           type: object
 *           required: [venueName, venueType, addressLine, city]
 *           properties:
 *             venueName:
 *               type: string
 *               example: Grand Hall
 *             venueType:
 *               type: string
 *               example: Banquet
 *             description:
 *               type: string
 *               example: Premium event venue in central Dhaka.
 *             addressLine:
 *               type: string
 *               example: 123 Main Road
 *             city:
 *               type: string
 *               example: Dhaka
 *             area:
 *               type: string
 *               example: Farmgate
 *         pricing:
 *           type: object
 *           required: [pricePerPerson]
 *           properties:
 *             basePrice:
 *               type: number
 *               example: 5000
 *               deprecated: true
 *             pricePerPerson:
 *               type: number
 *               example: 5000
 *             currency:
 *               type: string
 *               example: BDT
 *             discount:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [percentage, fixed]
 *                 value:
 *                   type: number
 *             amenities:
 *               type: object
 *               additionalProperties:
 *                 type: boolean
 *               example:
 *                 wifi: true
 *                 parking: true
 *                 ac: true
 *                 catering: false
 *                 audioVideo: true
 *                 security: true
 *                 accessible: false
 *                 soundSystem: true
 *         capacity:
 *           type: object
 *           required: [maximumGuests]
 *           properties:
 *             maximumGuests:
 *               type: integer
 *               example: 300
 *         media:
 *           type: object
 *           description: galleryImages and videoUrl must be valid URLs when provided.
 *           properties:
 *             galleryImages:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *               example:
 *                 - https://cdn.example.com/venues/grand-hall-1.jpg
 *                 - https://cdn.example.com/venues/grand-hall-2.jpg
 *             videoUrl:
 *               type: string
 *               format: uri
 *               example: https://www.youtube.com/watch?v=abc123
 *         availabilityCalendar:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VenueAvailabilityCalendarEntry'
 *     VenueUpdateRequest:
 *       type: object
 *       properties:
 *         information:
 *           type: object
 *         pricing:
 *           type: object
 *         capacity:
 *           type: object
 *         media:
 *           type: object
 *         availabilityCalendar:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VenueAvailabilityCalendarEntry'
 *     VenueEntity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         ownerId:
 *           type: string
 *         information:
 *           type: object
 *         pricing:
 *           type: object
 *         capacity:
 *           type: object
 *         media:
 *           type: object
 *         availability:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: integer
 *         publishStatus:
 *           type: string
 *           enum: [pending, published, rejected]
 *         approvedBy:
 *           nullable: true
 *           type: object
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         reviews:
 *           type: array
 *           items:
 *             type: object
 *         isDeleted:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     VenueListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VenueEntity'
 *     VenueResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/VenueEntity'
 *     VenueProviderDashboardAnalytics:
 *       type: object
 *       properties:
 *         totalVenues:
 *           type: integer
 *           example: 24
 *         upcomingBookings:
 *           type: integer
 *           example: 47
 *         monthlyRevenue:
 *           type: number
 *           example: 18420
 *         currency:
 *           type: string
 *           example: GBP
 *         averageRating:
 *           type: number
 *           example: 4.8
 *         totalReviews:
 *           type: integer
 *           example: 18
 *         month:
 *           type: string
 *           example: 2026-04
 *     VenueProviderDashboardAnalyticsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/VenueProviderDashboardAnalytics'
 *       example:
 *         success: true
 *         data:
 *           totalVenues: 24
 *           upcomingBookings: 47
 *           monthlyRevenue: 18420
 *           currency: GBP
 *           averageRating: 4.8
 *           totalReviews: 18
 *           month: 2026-04
 */

/**
 * @openapi
 * /api/v1/venue-provider/my-venues:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get own venues
 *     description: Authenticated venue providers can view only their own venues and optionally filter by publish status such as pending or published.
 *     security:
 *       - bearerAuth: []
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
 *       - in: query
 *         name: publishStatus
 *         schema:
 *           type: string
 *           enum: [pending, published, rejected]
 *         description: Use `pending` to see requested venues awaiting approval, `published` to see approved venues, or omit it to see both.
 *     responses:
 *       200:
 *         description: Own venue list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueListResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-venues',
  protect,
  authorize('venue_provider'),
  validate(ownVenuesQuerySchema),
  VenueProviderController.getOwnVenues
);

/**
 * @openapi
 * /api/v1/venue-provider/venues:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get published venues (public)
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
 *               $ref: '#/components/schemas/VenueListResponse'
 */
router.get('/venues', VenueProviderController.getVenues);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get one published venue by id (public)
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VenueEntity'
 *       404:
 *         description: Venue not found
 */
router.get('/venues/:venueId', validate(venueIdParamSchema), VenueProviderController.getVenueById);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}/availability:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get one venue availability calendar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: 2026-04
 *     responses:
 *       200:
 *         description: Availability returned
 *   patch:
 *     tags: [VenueProvider]
 *     summary: Block venue availability for a full day
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Availability blocked successfully
 *   delete:
 *     tags: [VenueProvider]
 *     summary: Unblock venue availability for a full day
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Availability unblocked successfully
 */
router.use(protect, authorize('venue_provider'));

/**
 * @openapi
 * /api/v1/venue-provider/dashboard/analytics:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get venue provider dashboard analytics
 *     description: Returns the venue provider dashboard card metrics including total venues, upcoming bookings, current month revenue, and average rating.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueProviderDashboardAnalyticsResponse'
 */
router.get('/dashboard/analytics', VenueProviderController.getDashboardAnalytics);

router.get(
  '/venues/:venueId/availability',
  validate(venueAvailabilityQuerySchema),
  VenueProviderController.getAvailability
);

router.patch(
  '/venues/:venueId/availability',
  validate(updateVenueAvailabilitySchema),
  VenueProviderController.blockAvailability
);

router.delete(
  '/venues/:venueId/availability',
  validate(updateVenueAvailabilitySchema),
  VenueProviderController.unblockAvailability
);

/**
 * @openapi
 * /api/v1/venue-provider/venues:
 *   post:
 *     tags: [VenueProvider]
 *     summary: Create a venue
 *     security:
 *       - bearerAuth: []
 *     description: Submit multipart form-data. Put the venue JSON in the `payload` field and attach optional image files in `images` or `image`. The backend uploads those files and appends the resulting URLs to `media.galleryImages`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: string
 *                 description: JSON string matching VenueCreateRequest. Include `media.galleryImages` only for already-hosted image URLs. Files sent in `images` or `image` are uploaded by the backend automatically.
 *                 example: '{"information":{"venueName":"Grand Hall","venueType":"Banquet","description":"Premium event venue in central Dhaka.","addressLine":"123 Main Road","city":"Dhaka","area":"Farmgate"},"pricing":{"pricePerPerson":5000,"currency":"BDT","discount":{"type":"percentage","value":10},"amenities":{"wifi":true,"parking":true,"ac":true,"catering":false,"audioVideo":true,"security":true,"accessible":false,"soundSystem":true}},"capacity":{"maximumGuests":300},"media":{"galleryImages":[],"videoUrl":"https://www.youtube.com/watch?v=abc123"},"availabilityCalendar":[{"date":"2026-03-20","hours":[8,9,10]}]}'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional venue gallery images. Up to 10 files.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional single-image field supported for client compatibility.
 *           examples:
 *             validVenue:
 *               summary: Valid venue creation payload
 *               value:
 *                 payload: '{"information":{"venueName":"Grand Hall","venueType":"Banquet","description":"Premium event venue in central Dhaka.","addressLine":"123 Main Road","city":"Dhaka","area":"Farmgate"},"pricing":{"pricePerPerson":5000,"currency":"BDT","discount":{"type":"percentage","value":10},"amenities":{"wifi":true,"parking":true,"ac":true,"catering":false,"audioVideo":true,"security":true,"accessible":false,"soundSystem":true}},"capacity":{"maximumGuests":300},"media":{"galleryImages":[],"videoUrl":"https://www.youtube.com/watch?v=abc123"},"availabilityCalendar":[{"date":"2026-03-20","hours":[8,9,10]}]}'
 *     responses:
 *       201:
 *         description: Venue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/venues',
  imageUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  validate(createVenueSchema),
  VenueProviderController.createVenue
);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}:
 *   patch:
 *     tags: [VenueProvider]
 *     summary: Update venue by id
 *     security:
 *       - bearerAuth: []
 *     description: Submit multipart form-data. Put the partial venue JSON in the `payload` field and attach optional image files in `images` or `image`. The backend uploads those files and appends the resulting URLs to `media.galleryImages`.
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [payload]
 *             properties:
 *               payload:
 *                 type: string
 *                 description: JSON string matching VenueUpdateRequest. Files sent in `images` or `image` are uploaded by the backend automatically.
 *                 example: '{"pricing":{"amenities":{"wifi":true,"parking":true,"ac":true,"catering":true,"audioVideo":true,"security":true,"accessible":true,"soundSystem":true}},"capacity":{"maximumGuests":550},"media":{"galleryImages":[],"videoUrl":"https://youtube.com/watch?v=updated-venue"},"availabilityCalendar":[{"date":"2026-04-19","hours":[18]}]}'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional venue gallery images. Up to 10 files.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional single-image field supported for client compatibility.
 *           examples:
 *             validVenueUpdate:
 *               summary: Valid venue update payload
 *               value:
 *                 payload: '{"pricing":{"amenities":{"wifi":true,"parking":true,"ac":true,"catering":true,"audioVideo":true,"security":true,"accessible":true,"soundSystem":true}},"capacity":{"maximumGuests":550},"media":{"galleryImages":[],"videoUrl":"https://youtube.com/watch?v=updated-venue"},"availabilityCalendar":[{"date":"2026-04-19","hours":[18]}]}'
 *     responses:
 *       200:
 *         description: Venue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Venue not found
 */
router.patch(
  '/venues/:venueId',
  imageUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  validate(updateVenueSchema),
  VenueProviderController.updateVenue
);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}:
 *   delete:
 *     tags: [VenueProvider]
 *     summary: Delete venue by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Venue deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Venue not found
 */
router.delete('/venues/:venueId', validate(venueIdParamSchema), VenueProviderController.deleteVenue);

export const venueProviderRouter = router;

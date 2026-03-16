import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { VenueProviderController } from './venue-provider.controller';
import { createVenueSchema, updateVenueSchema, venueIdParamSchema } from './venue-provider.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: VenueProvider
 *     description: Public listing and provider management for venues
 * components:
 *   schemas:
 *     VenueAvailabilityOverride:
 *       type: object
 *       required: [date, status]
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: 2026-03-20
 *         status:
 *           type: string
 *           enum: [available, pending, booked]
 *           example: available
 *     VenueCreateRequest:
 *       type: object
 *       required: [information, pricing, capacity, media]
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
 *           required: [basePrice]
 *           properties:
 *             basePrice:
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
 *         capacity:
 *           type: object
 *           required: [maximumGuests]
 *           properties:
 *             maximumGuests:
 *               type: integer
 *               example: 300
 *         media:
 *           type: object
 *           properties:
 *             galleryImages:
 *               type: array
 *               items:
 *                 type: string
 *                 format: uri
 *             videoUrl:
 *               type: string
 *               format: uri
 *         availabilityOverrides:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VenueAvailabilityOverride'
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
 *         availabilityOverrides:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VenueAvailabilityOverride'
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
 *         availabilityOverrides:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VenueAvailabilityOverride'
 *         publishStatus:
 *           type: string
 *           enum: [pending, published, rejected]
 *         approvedBy:
 *           nullable: true
 *           oneOf:
 *             - type: object
 *             - type: 'null'
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
 */

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

router.use(protect, authorize('venue_provider'));

/**
 * @openapi
 * /api/v1/venue-provider/venues:
 *   post:
 *     tags: [VenueProvider]
 *     summary: Create a venue
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenueCreateRequest'
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
router.post('/venues', validate(createVenueSchema), VenueProviderController.createVenue);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}:
 *   patch:
 *     tags: [VenueProvider]
 *     summary: Update venue by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenueUpdateRequest'
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
router.patch('/venues/:venueId', validate(updateVenueSchema), VenueProviderController.updateVenue);

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

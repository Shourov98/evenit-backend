import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { VenueProviderController } from './venue-provider.controller';
import { createVenueSchema, updateVenueSchema, venueIdParamSchema } from './venue-provider.schema';

const router = Router();

router.use(protect, authorize('venue_provider'));

/**
 * @openapi
 * /api/v1/venue-provider/venues:
 *   post:
 *     tags: [VenueProvider]
 *     summary: Create a venue
 *     security:
 *       - bearerAuth: []
 */
router.post('/venues', validate(createVenueSchema), VenueProviderController.createVenue);

/**
 * @openapi
 * /api/v1/venue-provider/venues:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get all venues of current venue provider
 *     security:
 *       - bearerAuth: []
 */
router.get('/venues', VenueProviderController.getMyVenues);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}:
 *   get:
 *     tags: [VenueProvider]
 *     summary: Get one venue by id
 *     security:
 *       - bearerAuth: []
 */
router.get('/venues/:venueId', validate(venueIdParamSchema), VenueProviderController.getVenueById);

/**
 * @openapi
 * /api/v1/venue-provider/venues/{venueId}:
 *   patch:
 *     tags: [VenueProvider]
 *     summary: Update venue by id
 *     security:
 *       - bearerAuth: []
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
 */
router.delete('/venues/:venueId', validate(venueIdParamSchema), VenueProviderController.deleteVenue);

export const venueProviderRouter = router;


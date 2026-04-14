import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { parseMultipartJsonBody } from '../../common/middlewares/multipart-json.middleware';
import { imageUpload } from '../../common/middlewares/upload.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { ServiceProviderController } from './service-provider.controller';
import {
  createServiceSchema,
  ownServicesQuerySchema,
  serviceIdParamSchema,
  serviceAvailabilityQuerySchema,
  updateServiceSchema,
  updateServiceAvailabilitySchema
} from './service-provider.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: ServiceProvider
 *     description: Public listing and provider management for services
 * components:
 *   schemas:
 *     AvailabilityOverride:
 *       type: object
 *       required: [date, slots]
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: 2026-03-20
 *         slots:
 *           type: array
 *           items:
 *             type: object
 *             required: [hour, status]
 *             properties:
 *               hour:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 23
 *                 example: 8
 *               status:
 *                 type: string
 *                 enum: [available, pending, booked]
 *                 example: available
 *           example:
 *             - hour: 8
 *               status: available
 *             - hour: 9
 *               status: booked
 *             - hour: 10
 *               status: pending
 *     ServiceCreateRequest:
 *       type: object
 *       required: [information, pricing, settings, media]
 *       example:
 *         information:
 *           serviceName: Premium Catering
 *           category: Catering
 *           description: Corporate and wedding catering service.
 *           serviceArea:
 *             - Dhaka
 *             - Gazipur
 *           tags:
 *             - wedding
 *             - corporate
 *         pricing:
 *           amount: 50000
 *           pricingType: package
 *           currency: BDT
 *           discount:
 *             type: percentage
 *             value: 10
 *         settings:
 *           amenities:
 *             deliveryIncluded: true
 *             setupIncluded: true
 *           capacity: 300
 *         media:
 *           galleryImages:
 *             - https://cdn.example.com/services/catering-1.jpg
 *             - https://cdn.example.com/services/catering-2.jpg
 *           videoUrl: https://www.youtube.com/watch?v=abc123
 *         availabilityOverrides:
 *           - date: 2026-03-20
 *             slots:
 *               - hour: 10
 *                 status: booked
 *               - hour: 11
 *                 status: booked
 *           - date: 2026-03-21
 *             slots:
 *               - hour: 14
 *                 status: pending
 *               - hour: 15
 *                 status: pending
 *       properties:
 *         information:
 *           type: object
 *           required: [serviceName, category, serviceArea]
 *           properties:
 *             serviceName:
 *               type: string
 *               example: Wedding Photography
 *             category:
 *               type: string
 *               example: Photography
 *             description:
 *               type: string
 *               example: Full-day wedding photography service.
 *             serviceArea:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Dhaka", "Gazipur"]
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["wedding", "premium"]
 *         pricing:
 *           type: object
 *           required: [amount]
 *           properties:
 *             amount:
 *               type: number
 *               example: 15000
 *             pricingType:
 *               type: string
 *               enum: [fixed, hourly, daily, package]
 *               example: fixed
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
 *         settings:
 *           type: object
 *           properties:
 *             amenities:
 *               type: object
 *               additionalProperties:
 *                 type: boolean
 *               example:
 *                 homeService: true
 *                 emergencySupport: false
 *             capacity:
 *               type: integer
 *               example: 5
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
 *                 - https://cdn.example.com/services/catering-1.jpg
 *                 - https://cdn.example.com/services/catering-2.jpg
 *             videoUrl:
 *               type: string
 *               format: uri
 *               example: https://www.youtube.com/watch?v=abc123
 *         availabilityOverrides:
 *           type: array
 *           description: Each date requires a slots array. A plain date plus status is not valid.
 *           items:
 *             $ref: '#/components/schemas/AvailabilityOverride'
 *     ServiceUpdateRequest:
 *       type: object
 *       properties:
 *         information:
 *           type: object
 *         pricing:
 *           type: object
 *         settings:
 *           type: object
 *         media:
 *           type: object
 *         availabilityOverrides:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AvailabilityOverride'
 *     ServiceEntity:
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
 *         settings:
 *           type: object
 *         media:
 *           type: object
 *         availabilityOverrides:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AvailabilityOverride'
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
 *     ServiceListResponse:
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
 *             $ref: '#/components/schemas/ServiceEntity'
 *     ServiceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/ServiceEntity'
 */

/**
 * @openapi
 * /api/v1/service-provider/my-services:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get own services
 *     description: Authenticated service providers can view only their own services and optionally filter by publish status such as pending or published.
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
 *         description: Use `pending` to see requested services awaiting approval, `published` to see approved services, or omit it to see both.
 *     responses:
 *       200:
 *         description: Own service list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceListResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-services',
  protect,
  authorize('service_provider'),
  validate(ownServicesQuerySchema),
  ServiceProviderController.getOwnServices
);

/**
 * @openapi
 * /api/v1/service-provider/services:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get published services (public)
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
 *               $ref: '#/components/schemas/ServiceListResponse'
 */
router.get('/services', ServiceProviderController.getServices);

/**
 * @openapi
 * /api/v1/service-provider/services/{serviceId}:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get one published service by id (public)
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ServiceEntity'
 *       404:
 *         description: Service not found
 */
router.get('/services/:serviceId', validate(serviceIdParamSchema), ServiceProviderController.getServiceById);

router.use(protect, authorize('service_provider'));

router.get(
  '/services/:serviceId/availability',
  validate(serviceAvailabilityQuerySchema),
  ServiceProviderController.getAvailability
);

router.patch(
  '/services/:serviceId/availability',
  validate(updateServiceAvailabilitySchema),
  ServiceProviderController.blockAvailability
);

router.delete(
  '/services/:serviceId/availability',
  validate(updateServiceAvailabilitySchema),
  ServiceProviderController.unblockAvailability
);

/**
 * @openapi
 * /api/v1/service-provider/services:
 *   post:
 *     tags: [ServiceProvider]
 *     summary: Create a service
 *     security:
 *       - bearerAuth: []
 *     description: Submit multipart form-data. Put the service JSON in the `payload` field and attach optional image files in `images` or `image`. The backend uploads those files and appends the resulting URLs to `media.galleryImages`.
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
 *                 description: JSON string matching ServiceCreateRequest. Include `media.galleryImages` only for already-hosted image URLs. Files sent in `images` or `image` are uploaded by the backend automatically.
 *                 example: '{"information":{"serviceName":"Premium Catering","category":"Catering","description":"Corporate and wedding catering service.","serviceArea":["Dhaka","Gazipur"],"tags":["wedding","corporate"]},"pricing":{"amount":50000,"pricingType":"package","currency":"BDT","discount":{"type":"percentage","value":10}},"settings":{"amenities":{"deliveryIncluded":true,"setupIncluded":true},"capacity":300},"media":{"galleryImages":[],"videoUrl":"https://www.youtube.com/watch?v=abc123"},"availabilityOverrides":[{"date":"2026-03-20","slots":[{"hour":10,"status":"booked"},{"hour":11,"status":"booked"}]},{"date":"2026-03-21","slots":[{"hour":14,"status":"pending"},{"hour":15,"status":"pending"}]}]}'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional service gallery images. Up to 10 files.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional single-image field supported for client compatibility.
 *           examples:
 *             validService:
 *               summary: Valid service creation payload
 *               value:
 *                 payload: '{"information":{"serviceName":"Premium Catering","category":"Catering","description":"Corporate and wedding catering service.","serviceArea":["Dhaka","Gazipur"],"tags":["wedding","corporate"]},"pricing":{"amount":50000,"pricingType":"package","currency":"BDT","discount":{"type":"percentage","value":10}},"settings":{"amenities":{"deliveryIncluded":true,"setupIncluded":true},"capacity":300},"media":{"galleryImages":[],"videoUrl":"https://www.youtube.com/watch?v=abc123"},"availabilityOverrides":[{"date":"2026-03-20","slots":[{"hour":10,"status":"booked"},{"hour":11,"status":"booked"}]},{"date":"2026-03-21","slots":[{"hour":14,"status":"pending"},{"hour":15,"status":"pending"}]}]}'
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/services',
  imageUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  validate(createServiceSchema),
  ServiceProviderController.createService
);

/**
 * @openapi
 * /api/v1/service-provider/services/{serviceId}:
 *   patch:
 *     tags: [ServiceProvider]
 *     summary: Update service by id
 *     security:
 *       - bearerAuth: []
 *     description: Submit multipart form-data. Put the partial service JSON in the `payload` field and attach optional image files in `images` or `image`. The backend uploads those files and appends the resulting URLs to `media.galleryImages`.
 *     parameters:
 *       - in: path
 *         name: serviceId
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
 *                 description: JSON string matching ServiceUpdateRequest. Files sent in `images` or `image` are uploaded by the backend automatically.
 *                 example: '{"pricing":{"amount":45000,"discount":{"type":"fixed","value":5000}},"media":{"galleryImages":[],"videoUrl":"https://youtube.com/watch?v=updated-service"},"availabilityOverrides":[{"date":"2026-04-13","slots":[{"hour":12,"status":"booked"}]}]}'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional service gallery images. Up to 10 files.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional single-image field supported for client compatibility.
 *           examples:
 *             validServiceUpdate:
 *               summary: Valid service update payload
 *               value:
 *                 payload: '{"pricing":{"amount":45000,"discount":{"type":"fixed","value":5000}},"media":{"galleryImages":[],"videoUrl":"https://youtube.com/watch?v=updated-service"},"availabilityOverrides":[{"date":"2026-04-13","slots":[{"hour":12,"status":"booked"}]}]}'
 *     responses:
 *       200:
 *         description: Service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.patch(
  '/services/:serviceId',
  imageUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 }
  ]),
  parseMultipartJsonBody('payload'),
  validate(updateServiceSchema),
  ServiceProviderController.updateService
);

/**
 * @openapi
 * /api/v1/service-provider/services/{serviceId}:
 *   delete:
 *     tags: [ServiceProvider]
 *     summary: Delete service by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service deleted successfully
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
 *                   example: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.delete('/services/:serviceId', validate(serviceIdParamSchema), ServiceProviderController.deleteService);

export const serviceProviderRouter = router;

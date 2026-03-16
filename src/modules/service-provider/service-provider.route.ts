import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { ServiceProviderController } from './service-provider.controller';
import { createServiceSchema, serviceIdParamSchema, updateServiceSchema } from './service-provider.schema';

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
 *     ServiceCreateRequest:
 *       type: object
 *       required: [information, pricing, settings, media]
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

/**
 * @openapi
 * /api/v1/service-provider/services:
 *   post:
 *     tags: [ServiceProvider]
 *     summary: Create a service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceCreateRequest'
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
router.post('/services', validate(createServiceSchema), ServiceProviderController.createService);

/**
 * @openapi
 * /api/v1/service-provider/services/{serviceId}:
 *   patch:
 *     tags: [ServiceProvider]
 *     summary: Update service by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceUpdateRequest'
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
router.patch('/services/:serviceId', validate(updateServiceSchema), ServiceProviderController.updateService);

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

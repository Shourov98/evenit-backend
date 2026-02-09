import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { ServiceProviderController } from './service-provider.controller';
import { createServiceSchema, serviceIdParamSchema, updateServiceSchema } from './service-provider.schema';

const router = Router();

router.use(protect, authorize('service_provider'));

/**
 * @openapi
 * /api/v1/service-provider/services:
 *   post:
 *     tags: [ServiceProvider]
 *     summary: Create a service
 *     security:
 *       - bearerAuth: []
 */
router.post('/services', validate(createServiceSchema), ServiceProviderController.createService);

/**
 * @openapi
 * /api/v1/service-provider/services:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get all services of current service provider
 *     security:
 *       - bearerAuth: []
 */
router.get('/services', ServiceProviderController.getMyServices);

/**
 * @openapi
 * /api/v1/service-provider/services/{serviceId}:
 *   get:
 *     tags: [ServiceProvider]
 *     summary: Get one service by id
 *     security:
 *       - bearerAuth: []
 */
router.get('/services/:serviceId', validate(serviceIdParamSchema), ServiceProviderController.getServiceById);

/**
 * @openapi
 * /api/v1/service-provider/services/{serviceId}:
 *   patch:
 *     tags: [ServiceProvider]
 *     summary: Update service by id
 *     security:
 *       - bearerAuth: []
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
 */
router.delete('/services/:serviceId', validate(serviceIdParamSchema), ServiceProviderController.deleteService);

export const serviceProviderRouter = router;


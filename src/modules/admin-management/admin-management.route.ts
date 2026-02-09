import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { AdminManagementController } from './admin-management.controller';
import { serviceIdParamSchema, venueIdParamSchema } from './admin-management.schema';

const router = Router();

router.use(protect, authorize('admin', 'super_admin'));

/**
 * @openapi
 * /api/v1/admin/venues/{venueId}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve venue and publish it
 *     security:
 *       - bearerAuth: []
 */
router.patch('/venues/:venueId/approve', validate(venueIdParamSchema), AdminManagementController.approveVenue);

/**
 * @openapi
 * /api/v1/admin/venues/{venueId}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject venue
 *     security:
 *       - bearerAuth: []
 */
router.patch('/venues/:venueId/reject', validate(venueIdParamSchema), AdminManagementController.rejectVenue);

/**
 * @openapi
 * /api/v1/admin/services/{serviceId}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve service and publish it
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/services/:serviceId/approve',
  validate(serviceIdParamSchema),
  AdminManagementController.approveService
);

/**
 * @openapi
 * /api/v1/admin/services/{serviceId}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject service
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/services/:serviceId/reject',
  validate(serviceIdParamSchema),
  AdminManagementController.rejectService
);

export const adminManagementRouter = router;


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
 * tags:
 *   - name: Admin
 *     description: Admin and super-admin moderation endpoints for services and venues
 */

/**
 * @openapi
 * /api/v1/admin/venues/{venueId}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve venue and publish it
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *         example: 65f1a9d0f1b2c3d4e5f60718
 *     responses:
 *       200:
 *         description: Venue approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
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
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VenueResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Venue not found
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
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
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
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Service not found
 */
router.patch(
  '/services/:serviceId/reject',
  validate(serviceIdParamSchema),
  AdminManagementController.rejectService
);

export const adminManagementRouter = router;

import { Router } from 'express';
import { authorize } from '../../common/middlewares/authorize.middleware';
import { protect } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validate.middleware';
import { SiteContentController } from './site-content.controller';
import {
  listSiteContentsSchema,
  siteContentSectionParamSchema,
  upsertSiteContentSchema
} from './site-content.schema';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Site Content
 *     description: Public and admin-managed static content endpoints
 * components:
 *   schemas:
 *     SiteContent:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 67f0ef57ab12cd34ef56ab78
 *         section:
 *           type: string
 *           enum: [mission, vision, about-us, privacy-policy, terms-and-conditions]
 *           example: mission
 *         content:
 *           type: string
 *           example: "<p>Our mission is to simplify event planning.</p>"
 *         updatedBy:
 *           type: object
 *           nullable: true
 *           properties:
 *             userId:
 *               type: string
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SiteContentInput:
 *       type: object
 *       required: [content]
 *       properties:
 *         content:
 *           type: string
 *           example: "<h1>About Us</h1><p>EvenIt helps users book event services faster.</p>"
 *     SiteContentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SiteContent'
 *       example:
 *         success: true
 *         data:
 *           - _id: 67f0ef57ab12cd34ef56ab78
 *             section: about-us
 *             content: "<h1>About Us</h1><p>EvenIt helps users book event services faster.</p>"
 *             updatedBy:
 *               userId: 6807f0c6c1b2f4a9d9123456
 *               fullName: Admin User
 *               email: admin@example.com
 *             createdAt: "2026-04-20T08:00:00.000Z"
 *             updatedAt: "2026-04-23T06:30:00.000Z"
 *           - _id: 67f0ef57ab12cd34ef56ab79
 *             section: mission
 *             content: "<p>Our mission is to simplify event planning.</p>"
 *             updatedBy:
 *               userId: 6807f0c6c1b2f4a9d9123456
 *               fullName: Admin User
 *               email: admin@example.com
 *             createdAt: "2026-04-18T09:15:00.000Z"
 *             updatedAt: "2026-04-22T11:10:00.000Z"
 *     SiteContentSingleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/SiteContent'
 *       example:
 *         success: true
 *         data:
 *           _id: 67f0ef57ab12cd34ef56ab78
 *           section: about-us
 *           content: "<h1>About Us</h1><p>EvenIt helps users book event services faster.</p>"
 *           updatedBy:
 *             userId: 6807f0c6c1b2f4a9d9123456
 *             fullName: Admin User
 *             email: admin@example.com
 *           createdAt: "2026-04-20T08:00:00.000Z"
 *           updatedAt: "2026-04-23T06:30:00.000Z"
 *     SiteContentUpsertResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Site content saved successfully
 *         data:
 *           $ref: '#/components/schemas/SiteContent'
 *       example:
 *         success: true
 *         message: Site content saved successfully
 *         data:
 *           _id: 67f0ef57ab12cd34ef56ab78
 *           section: about-us
 *           content: "<h1>About Us</h1><p>EvenIt helps users book event services faster.</p>"
 *           updatedBy:
 *             userId: 6807f0c6c1b2f4a9d9123456
 *             fullName: Admin User
 *             email: admin@example.com
 *           createdAt: "2026-04-20T08:00:00.000Z"
 *           updatedAt: "2026-04-23T06:30:00.000Z"
 */

/**
 * @openapi
 * /api/v1/site-content:
 *   get:
 *     tags: [Site Content]
 *     summary: Get all site content sections
 *     responses:
 *       200:
 *         description: All available site content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteContentListResponse'
 */
router.get('/', validate(listSiteContentsSchema), SiteContentController.getAll);

/**
 * @openapi
 * /api/v1/site-content/{section}:
 *   get:
 *     tags: [Site Content]
 *     summary: Get one site content section
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mission, vision, about-us, privacy-policy, terms-and-conditions]
 *     responses:
 *       200:
 *         description: Requested site content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteContentSingleResponse'
 *       404:
 *         description: Content not found
 *   post:
 *     tags: [Site Content]
 *     summary: Create or update one site content section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mission, vision, about-us, privacy-policy, terms-and-conditions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SiteContentInput'
 *     responses:
 *       200:
 *         description: Content saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteContentUpsertResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/:section', validate(siteContentSectionParamSchema), SiteContentController.getBySection);
router.post(
  '/:section',
  protect,
  authorize('admin', 'super_admin'),
  validate(upsertSiteContentSchema),
  SiteContentController.upsert
);

export { router as siteContentRouter };

import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { imageUpload } from '../../common/middlewares/upload.middleware';
import { UploadController } from './upload.controller';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Uploads
 *     description: Authenticated file upload endpoints
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Images uploaded successfully
 *         data:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               publicId:
 *                 type: string
 *               format:
 *                 type: string
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               bytes:
 *                 type: number
 *               originalName:
 *                 type: string
 *
 * @openapi
 * /api/v1/uploads/images:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload images to Cloudinary and return hosted links
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               folder:
 *                 type: string
 *                 example: services
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               image:
 *                 type: string
 *                 format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Images must be sent using image, images, file, or files field
 *       401:
 *         description: Unauthorized
 *
 * @openapi
 * /api/v1/uploads/venue-images:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload venue gallery images to Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Images must be sent using the images field
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/images',
  protect,
  imageUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 },
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 10 }
  ]),
  UploadController.uploadImages
);

router.post(
  '/venue-images',
  protect,
  imageUpload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 },
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 10 }
  ]),
  UploadController.uploadVenueImages
);

export const uploadRouter = router;

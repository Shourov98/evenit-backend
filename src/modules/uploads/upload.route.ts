import { Router } from 'express';
import { protect } from '../../common/middlewares/auth.middleware';
import { imageUpload } from '../../common/middlewares/upload.middleware';
import { UploadController } from './upload.controller';

const router = Router();

/**
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
 */
router.post('/venue-images', protect, imageUpload.array('images', 10), UploadController.uploadVenueImages);

export const uploadRouter = router;

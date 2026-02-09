import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.route';
import { venueProviderRouter } from '../modules/venue-provider/venue-provider.route';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Healthy
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'OK'
  });
});

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/venue-provider', venueProviderRouter);

export { router };

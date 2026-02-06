import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.route';

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

export { router };

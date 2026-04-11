import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '../common/middlewares/error.middleware';
import { applySecurityMiddleware } from '../common/middlewares/security.middleware';
import { openApiSpec } from './openapi';
import { router } from './routes';

const app = express();
const paymentTestDir = path.resolve(process.cwd(), 'public/payment-test');

applySecurityMiddleware(app);
app.get('/payment-test', (_req, res) => {
  res.sendFile(path.join(paymentTestDir, 'index.html'));
});
app.use('/payment-test', express.static(paymentTestDir));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };

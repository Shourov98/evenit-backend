import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '../common/middlewares/error.middleware';
import { applySecurityMiddleware } from '../common/middlewares/security.middleware';
import { openApiSpec } from './openapi';
import { router } from './routes';

const app = express();

applySecurityMiddleware(app);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };

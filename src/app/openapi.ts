import swaggerJsdoc from 'swagger-jsdoc';

export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Saqib Express API',
      version: '1.0.0',
      description: 'Production-grade modular Express API with TypeScript'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/modules/**/*.ts', './src/app/routes.ts']
});

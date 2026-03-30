const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const spec = swaggerJsdoc({
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

const outputPath = path.resolve(process.cwd(), 'apidog.openapi.json');
fs.writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);

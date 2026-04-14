import fs from 'fs';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const isDistRuntime = __filename.includes(`${path.sep}dist${path.sep}`);

const loadSpecFromJson = () => {
  const jsonPath = path.resolve(process.cwd(), 'apidog.openapi.json');
  if (!fs.existsSync(jsonPath)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  return parsed;
};

const buildSpecFromJSDoc = () =>
  swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'EvenIt Backend API',
        version: '1.0.0',
        description: 'Role-based event marketplace backend for auth, onboarding, listings, bookings, subscriptions, uploads, and admin moderation.'
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
    apis: isDistRuntime
      ? ['./dist/modules/**/*.js', './dist/app/routes.js']
      : ['./src/modules/**/*.ts', './src/app/routes.ts']
  });

const mergeSpecs = () => {
  const jsonSpec = loadSpecFromJson() as Record<string, any> | null;
  const jsDocSpec = buildSpecFromJSDoc() as Record<string, any>;

  if (!jsonSpec) {
    return jsDocSpec;
  }

  return {
    ...jsonSpec,
    ...jsDocSpec,
    info: {
      ...(jsonSpec.info || {}),
      ...(jsDocSpec.info || {})
    },
    servers: jsDocSpec.servers || jsonSpec.servers,
    tags: [...(jsonSpec.tags || []), ...(jsDocSpec.tags || [])],
    components: {
      ...(jsonSpec.components || {}),
      ...(jsDocSpec.components || {}),
      schemas: {
        ...(jsonSpec.components?.schemas || {}),
        ...(jsDocSpec.components?.schemas || {})
      },
      securitySchemes: {
        ...(jsonSpec.components?.securitySchemes || {}),
        ...(jsDocSpec.components?.securitySchemes || {})
      }
    },
    paths: {
      ...(jsonSpec.paths || {}),
      ...(jsDocSpec.paths || {})
    }
  };
};

export const openApiSpec = mergeSpecs();

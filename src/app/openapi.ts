import fs from 'fs';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

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
    apis: ['./src/modules/**/*.ts', './src/app/routes.ts', './dist/modules/**/*.js', './dist/app/routes.js']
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

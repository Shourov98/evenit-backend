import { mkdir, writeFile, access } from 'fs/promises';
import path from 'path';

const rawName = process.argv[2] || process.env.npm_config_name;

if (!rawName) {
  console.error('Usage: npm run module:generate -- <module-name>');
  console.error('Or: npm run module:generate --name=<module-name>');
  process.exit(1);
}

const moduleName = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
const camelName = moduleName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);
const moduleDir = path.join(process.cwd(), 'src', 'modules', moduleName);

const files: Record<string, string> = {
  [`${moduleName}.model.ts`]: `import { Document, Model, Schema, model, models } from 'mongoose';

export interface I${pascalName} extends Document {
  name: string;
}

const ${camelName}Schema = new Schema<I${pascalName}>(
  {
    name: { type: String, required: true, trim: true }
  },
  { timestamps: true, versionKey: false }
);

export const ${pascalName}Model: Model<I${pascalName}> =
  (models.${pascalName} as Model<I${pascalName}>) || model<I${pascalName}>('${pascalName}', ${camelName}Schema);
`,
  [`${moduleName}.schema.ts`]: `import { z } from 'zod';

export const create${pascalName}Schema = z.object({
  body: z.object({
    name: z.string().min(1)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
`,
  [`${moduleName}.service.ts`]: `import { ${pascalName}Model } from './${moduleName}.model';

export class ${pascalName}Service {
  static async create(payload: { name: string }) {
    return ${pascalName}Model.create(payload);
  }

  static async getAll() {
    return ${pascalName}Model.find().sort({ createdAt: -1 });
  }
}
`,
  [`${moduleName}.controller.ts`]: `import { Request, Response } from 'express';
import { catchAsync } from '../../common/utils/catchAsync';
import { ${pascalName}Service } from './${moduleName}.service';

export class ${pascalName}Controller {
  static create = catchAsync(async (req: Request, res: Response) => {
    const result = await ${pascalName}Service.create(req.body as { name: string });
    return res.status(201).json({ success: true, data: result });
  });

  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const result = await ${pascalName}Service.getAll();
    return res.status(200).json({ success: true, data: result });
  });
}
`,
  [`${moduleName}.route.ts`]: `import { Router } from 'express';
import { validate } from '../../common/middlewares/validate.middleware';
import { ${pascalName}Controller } from './${moduleName}.controller';
import { create${pascalName}Schema } from './${moduleName}.schema';

const router = Router();

router.post('/', validate(create${pascalName}Schema), ${pascalName}Controller.create);
router.get('/', ${pascalName}Controller.getAll);

export const ${camelName}Router = router;
`,
  [`${moduleName}.test.ts`]: `describe('${pascalName} module', () => {
  it('should have a placeholder test', () => {
    expect(true).toBe(true);
  });
});
`
};

const run = async (): Promise<void> => {
  try {
    await access(moduleDir);
    console.error(`Module already exists: src/modules/${moduleName}`);
    process.exit(1);
  } catch (_error) {
    await mkdir(moduleDir, { recursive: true });
  }

  await Promise.all(
    Object.entries(files).map(([filename, content]) =>
      writeFile(path.join(moduleDir, filename), content, 'utf-8')
    )
  );

  console.log(`Module created: src/modules/${moduleName}`);
  console.log(`Remember to mount ${camelName}Router in src/app/routes.ts`);
};

run().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});

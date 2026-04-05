import { z } from 'zod';
import { SITE_CONTENT_SECTIONS } from './site-content.model';

const siteContentSectionEnum = z.enum(SITE_CONTENT_SECTIONS);

export const upsertSiteContentSchema = z.object({
  params: z.object({
    section: siteContentSectionEnum
  }),
  body: z.object({
    content: z.string().trim().min(1, 'Content is required')
  }),
  query: z.object({}).optional().default({})
});

export const siteContentSectionParamSchema = z.object({
  params: z.object({
    section: siteContentSectionEnum
  }),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const listSiteContentsSchema = z.object({
  params: z.object({}).optional().default({}),
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

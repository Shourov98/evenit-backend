import { Document, Model, Schema, model, models } from 'mongoose';

export const SITE_CONTENT_SECTIONS = [
  'mission',
  'vision',
  'about-us',
  'privacy-policy',
  'terms-and-conditions'
] as const;

export type SiteContentSection = (typeof SITE_CONTENT_SECTIONS)[number];

export interface ISiteContent extends Document {
  section: SiteContentSection;
  content: string;
  updatedBy?: {
    userId: string;
    fullName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const siteContentSchema = new Schema<ISiteContent>(
  {
    section: {
      type: String,
      enum: SITE_CONTENT_SECTIONS,
      required: true,
      unique: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    updatedBy: {
      userId: {
        type: String,
        trim: true
      },
      fullName: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const SiteContentModel: Model<ISiteContent> =
  (models.SiteContent as Model<ISiteContent>) || model<ISiteContent>('SiteContent', siteContentSchema);

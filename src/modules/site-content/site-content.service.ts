import { AppError } from '../../common/errors/AppError';
import { SiteContentModel, SiteContentSection } from './site-content.model';

interface SiteContentEditor {
  userId: string;
  fullName: string;
  email: string;
}

export class SiteContentService {
  static async getAll() {
    return SiteContentModel.find().sort({ section: 1 });
  }

  static async getBySection(section: SiteContentSection) {
    const content = await SiteContentModel.findOne({ section });

    if (!content) {
      throw new AppError(404, `${section} content not found`);
    }

    return content;
  }

  static async upsert(
    section: SiteContentSection,
    payload: { content: string },
    editor: SiteContentEditor
  ) {
    return SiteContentModel.findOneAndUpdate(
      { section },
      {
        section,
        content: payload.content,
        updatedBy: {
          userId: editor.userId,
          fullName: editor.fullName,
          email: editor.email
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
  }
}

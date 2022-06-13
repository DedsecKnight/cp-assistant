import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { ObjectId } from "mongoose";

/**
 *
 * Represent how a template is stored in cp-assistant's system
 *
 * @param templateData template code
 * @param guildId Guild ID used to identify which guild the template belongs to
 * @param userId User ID used to identify the template's author
 * @param fileName name of template file (used for searching for template)
 *
 */
export default class Template {
  @prop()
  public templateData: string;

  @prop()
  public guildId: string;

  @prop()
  public userId: string;

  @prop()
  public fileName: string;

  public static async deleteDocument(
    this: ReturnModelType<typeof Template>,
    templateId: ObjectId
  ) {
    return this.deleteMany({ _id: templateId });
  }
}

export const TemplateModel = getModelForClass(Template);

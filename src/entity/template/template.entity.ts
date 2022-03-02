import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { ObjectId } from "mongoose";

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

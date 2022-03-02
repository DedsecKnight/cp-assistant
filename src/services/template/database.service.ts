import { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { ObjectId } from "mongoose";
import { singleton } from "tsyringe";
import Template, { TemplateModel } from "../../entity/template/template.entity";

@singleton()
export default class TemplateDatabaseService {
  private templateModel: ReturnModelType<typeof Template>;
  constructor() {
    this.templateModel = TemplateModel;
  }

  public async getUserTemplate(
    userId: string,
    guildId: string,
    fileName: string
  ): Promise<DocumentType<Template> | null> {
    const template = await this.templateModel.findOne({
      userId,
      guildId,
      fileName,
    });

    if (!template) {
      return null;
    }

    return template;
  }

  public async updateUserTemplate(
    userId: string,
    guildId: string,
    templateData: string,
    fileName: string
  ) {
    let template = await this.templateModel.findOne({
      userId,
      guildId,
      fileName,
    });
    if (template) {
      template.templateData = templateData;
      await template.save();
    } else {
      template = await this.templateModel.create({
        userId,
        guildId,
        templateData,
        fileName,
      });
    }
    return template;
  }

  public async getTemplatesByUser(userId: string, guildId: string) {
    return this.templateModel.find({ userId, guildId });
  }

  public async deleteTemplate(templateId: ObjectId) {
    return this.templateModel.deleteDocument(templateId);
  }
}

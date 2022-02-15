import { singleton } from "tsyringe";
import { ReturnModelType, DocumentType } from "@typegoose/typegoose";
import Template, { TemplateModel } from "../entity/template.entity";
import mongoose, { ObjectId } from "mongoose";
import KattisCookie, {
  KattisCookieModel,
} from "../entity/cookies.kattis.entity";
import KattisProblem, {
  KattisProblemModel,
} from "../entity/problem.kattis.entity";

@singleton()
export default class DatabaseService {
  private templateModel: ReturnModelType<typeof Template>;
  private kattisCookiesModel: ReturnModelType<typeof KattisCookie>;
  private kattisProblemModel: ReturnModelType<typeof KattisProblem>;

  constructor() {
    this.templateModel = TemplateModel;
    this.kattisCookiesModel = KattisCookieModel;
    this.kattisProblemModel = KattisProblemModel;
  }

  public async connect() {
    return mongoose.connect(process.env.MONGODB_URI!, {
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
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

  public async updateUserKattisCookie(userId: string, cookie: string) {
    let cookieData = await this.kattisCookiesModel.findOne({ userId });
    if (!cookieData) {
      cookieData = await this.kattisCookiesModel.create({ userId, cookie });
    } else {
      cookieData.cookie = cookie;
      await cookieData.save();
    }
    return cookieData;
  }

  public async getUserKattisCookie(userId: string) {
    return this.kattisCookiesModel.findOne({ userId });
  }

  public async updateKattisProblemDatabase(problems: KattisProblem[]) {
    return Promise.all(
      problems.map(async (problem) => {
        let problemObj = await this.kattisProblemModel.findOne({
          problemId: problem.problemId,
        });
        if (!problemObj) {
          return this.kattisProblemModel.create(problem);
        }
        const { difficulty } = problem;

        problemObj.difficulty = difficulty;

        return problemObj.save();
      })
    );
  }

  public async generateRandomProblem(lowBound: number, highBound: number) {
    const problems = await this.kattisProblemModel.find({
      difficulty: {
        $lte: highBound,
        $gte: lowBound,
      },
    });

    if (problems.length === 0) {
      return null;
    }

    problems.sort(() => {
      const idxA = Math.random(),
        idxB = Math.random();
      return idxA - idxB;
    });

    return problems[0];
  }
}

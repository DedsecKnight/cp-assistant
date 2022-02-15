import { singleton } from "tsyringe";
import { ReturnModelType, DocumentType } from "@typegoose/typegoose";
import Template, { TemplateModel } from "../entity/template.entity";
import mongoose, { ObjectId } from "mongoose";
import KattisProblem, {
  KattisProblemModel,
} from "../entity/problem.kattis.entity";
import KattisUser, { KattisUserModel } from "../entity/user.kattis.entity";

@singleton()
export default class DatabaseService {
  private templateModel: ReturnModelType<typeof Template>;
  private kattisProblemModel: ReturnModelType<typeof KattisProblem>;
  private kattisUserModel: ReturnModelType<typeof KattisUser>;

  constructor() {
    this.templateModel = TemplateModel;
    this.kattisProblemModel = KattisProblemModel;
    this.kattisUserModel = KattisUserModel;
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

  public async updateUserKattis(
    userDiscordId: string,
    username: string,
    password: string
  ) {
    const userObj = await this.kattisUserModel.findOne({
      userDiscordId,
    });
    if (!userObj) {
      return this.kattisUserModel.create({
        userDiscordId,
        kattisUsername: username,
        kattisPassword: password,
      });
    }
    userObj.kattisUsername = username;
    userObj.kattisPassword = password;
    await userObj.save();
  }

  public async getUserKattis(userDiscordId: string) {
    return this.kattisUserModel.findOne({ userDiscordId });
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

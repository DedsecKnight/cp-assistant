import { ReturnModelType } from "@typegoose/typegoose";
import { singleton } from "tsyringe";
import KattisProblem, {
  KattisProblemModel,
} from "../../entity/kattis/problem.entity";
import KattisUser, { KattisUserModel } from "../../entity/kattis/user.entity";

@singleton()
export default class KattisDatabaseService {
  private kattisProblemModel: ReturnModelType<typeof KattisProblem>;
  private kattisUserModel: ReturnModelType<typeof KattisUser>;

  constructor() {
    this.kattisProblemModel = KattisProblemModel;
    this.kattisUserModel = KattisUserModel;
  }

  public async updateUserCredentials(
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

  public async getUserCredentials(userDiscordId: string) {
    return this.kattisUserModel.findOne({ userDiscordId });
  }

  public async updateProblemDatabase(problems: KattisProblem[]) {
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

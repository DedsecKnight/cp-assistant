import axios from "axios";
import { injectable, singleton } from "tsyringe";
import CodeforcesProblem from "../../entity/problem.codeforces.entity";
import { RandomProblemGenerateConfig } from "../../interfaces/codeforces.interface";
import CodeforcesDatabaseService from "./database.service";

@singleton()
@injectable()
export default class CodeforcesUtilsService {
  constructor(private databaseService: CodeforcesDatabaseService) {}

  private async getProblemList(): Promise<
    WithResponseStatusCode<{ problems: CodeforcesProblem[] }>
  > {
    try {
      const {
        data: { status, result },
      } = await axios.get("https://codeforces.com/api/problemset.problems");
      if (status !== "OK")
        return {
          statusCode: 500,
          problems: [],
        };
      return {
        statusCode: 200,
        problems: result.problems,
      };
    } catch (error) {
      return {
        statusCode: 500,
        problems: [],
      };
    }
  }

  public async generateRandomProblem(
    problemConfig: RandomProblemGenerateConfig
  ) {
    return this.databaseService.generateRandomProblem(problemConfig);
  }

  public async updateProblemDatabase(): Promise<WithResponseStatusCode<any>> {
    const { statusCode, problems } = await this.getProblemList();
    if (statusCode === 200) {
      await this.databaseService.updateProblemDatabase(problems);
    }
    return { statusCode };
  }
}

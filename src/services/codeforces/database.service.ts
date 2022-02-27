import { ReturnModelType } from "@typegoose/typegoose";
import { singleton } from "tsyringe";
import CodeforcesProblem, {
  CodeforcesProblemModel,
} from "../../entity/problem.codeforces.entity";

@singleton()
export default class CodeforcesDatabaseService {
  private codeforcesProblemModel: ReturnModelType<typeof CodeforcesProblem>;

  constructor() {
    this.codeforcesProblemModel = CodeforcesProblemModel;
  }

  public async updateProblemDatabase(problems: CodeforcesProblem[]) {
    return Promise.all(
      problems.map(async (problem) => {
        let problemObj = await this.codeforcesProblemModel.findOne({
          contestId: problem.contestId,
          index: problem.index,
        });
        if (!problemObj) {
          return this.codeforcesProblemModel.create(problem);
        }
      })
    );
  }
}

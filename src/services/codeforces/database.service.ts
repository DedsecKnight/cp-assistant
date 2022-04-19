import { ReturnModelType } from "@typegoose/typegoose";
import { singleton } from "tsyringe";
import CodeforcesProblem, {
  CodeforcesProblemModel,
} from "../../entity/codeforces/problem.entity";
import { RandomProblemGenerateConfig } from "../../interfaces/codeforces.interface";

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

  public async generateRandomProblem({
    minRating,
    maxRating,
    topic,
  }: RandomProblemGenerateConfig) {
    let filter: any = {
      rating: {
        $gte: minRating,
        $lte: maxRating,
      },
    };

    if (topic !== "") {
      filter = { ...filter, tags: topic };
    }
    const problems = await this.codeforcesProblemModel.find(filter);

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

import { getModelForClass, prop } from "@typegoose/typegoose";

/**
 *
 * Represent a Kattis problem
 *
 * @param problemId ID of the problem in Kattis system
 * @param name Problem Name
 * @param difficulty Difficulty of the problem
 *
 */
export default class KattisProblem {
  @prop({ type: () => String })
  problemId: string;

  @prop({ type: () => String })
  name: string;

  @prop()
  difficulty: number;
}

/**
 *
 * Represent a Kattis problem in a Kattis contest
 *
 * @param problemId ID of the problem in Kattis system
 * @param name Problem Name
 * @param difficulty Difficulty of the problem
 * @param letter Letter index of the problem in the contest
 *
 *
 */
export type KattisContestProblem = KattisProblem & {
  letter: string;
};

export const KattisProblemModel = getModelForClass(KattisProblem);

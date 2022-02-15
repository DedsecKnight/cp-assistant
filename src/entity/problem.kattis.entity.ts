import { getModelForClass, prop } from "@typegoose/typegoose";

export default class KattisProblem {
  @prop({ type: () => String })
  problemId: string;

  @prop({ type: () => String })
  name: string;

  @prop()
  difficulty: number;
}

export type KattisContestProblem = KattisProblem & {
  letter: string;
};

export const KattisProblemModel = getModelForClass(KattisProblem);

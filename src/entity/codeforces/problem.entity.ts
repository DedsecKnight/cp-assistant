import { getModelForClass, prop, PropType } from "@typegoose/typegoose";

/**
 *
 * Represent a Codeforce problem
 *
 * @param contestId ID of the Codeforces contest from which the problem is from
 * @param index Letter index of problem in the contest
 * @param name Name of the problem
 * @param tags List of problem tags
 * @param rating Rating of a Codeforce problem
 *
 */
export default class CodeforcesProblem {
  @prop({ type: () => String })
  contestId: string;

  // Letter of problem (A, B, or C)
  @prop({ type: () => String })
  index: string;

  // Name of the problem
  @prop({ type: () => String })
  name: string;

  // Tag of problem
  @prop({ type: () => [String] }, PropType.ARRAY)
  tags: string;

  // Rating of problem
  @prop()
  rating: number;
}

export const CodeforcesProblemModel = getModelForClass(CodeforcesProblem);

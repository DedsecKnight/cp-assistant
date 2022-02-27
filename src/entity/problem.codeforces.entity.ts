import { getModelForClass, prop, PropType } from "@typegoose/typegoose";

export default class CodeforcesProblem {
  @prop({ type: () => String })
  contestId: string;

  @prop({ type: () => String })
  index: string;

  @prop({ type: () => String })
  name: string;

  @prop({ type: () => [String] }, PropType.ARRAY)
  tags: string;

  @prop()
  rating: number;
}

export const CodeforcesProblemModel = getModelForClass(CodeforcesProblem);

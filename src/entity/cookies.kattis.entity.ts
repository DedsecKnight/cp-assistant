import { getModelForClass, prop, PropType } from "@typegoose/typegoose";

export default class KattisCookie {
  @prop({ type: () => String })
  public cookie: string;

  @prop()
  public userId: string;
}

export const KattisCookieModel = getModelForClass(KattisCookie);

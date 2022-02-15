import { getModelForClass, prop } from "@typegoose/typegoose";

export default class KattisUser {
  @prop()
  userDiscordId: string;

  @prop()
  kattisUsername: string;

  @prop()
  kattisPassword: string;
}

export const KattisUserModel = getModelForClass(KattisUser);

import { getModelForClass, prop } from "@typegoose/typegoose";

/**
 *
 * Represent how a Kattis user profile is stored in cp-assistant's database system
 *
 * @param userDiscordId Discord ID of a user
 * @param kattisUsername Kattis username of account belonging to user with corresponding discord ID
 * @param kattisPassword Encrypted Kattis password of the account with the above username
 *
 */
export default class KattisUser {
  @prop()
  userDiscordId: string;

  @prop()
  kattisUsername: string;

  @prop()
  kattisPassword: string;
}

export const KattisUserModel = getModelForClass(KattisUser);

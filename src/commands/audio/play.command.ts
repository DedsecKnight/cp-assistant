import { singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import MusicSubscription from "../../entity/subscription.entity";

@singleton()
export default class PlayCommand implements ICommand<MusicSubscription> {
  public commandName: string = "play";
  public commandDescription: string = "Start/Resume audio player";
  public commandParams: string[] = [];
  public async execute(subscription: MusicSubscription, args: string[]) {
    await subscription.processPlayCommand();
  }
}

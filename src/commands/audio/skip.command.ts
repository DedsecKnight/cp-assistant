import { singleton } from "tsyringe";
import MusicSubscription from "../../entity/subscription.entity";
import { ICommand } from "../../interfaces/command.interface";

@singleton()
export default class SkipSongCommand implements ICommand<MusicSubscription> {
  public commandName: string = "skip";
  public commandDescription: string = "Skip current song";
  public commandParams: string[] = [];
  public async execute(subscription: MusicSubscription) {
    await subscription.processSkipCommand();
  }
}

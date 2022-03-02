import { singleton } from "tsyringe";
import MusicSubscription from "../../entity/audio/subscription.entity";
import { ICommand } from "../../interfaces/command.interface";

@singleton()
export default class CurrentSongCommand implements ICommand<MusicSubscription> {
  public commandName: string = "current";
  public commandDescription: string = "Show currently playing song.";
  public commandParams: string[] = [];
  public async execute(subscription: MusicSubscription, args: string[]) {
    await subscription.processCurrentSongCommand();
  }
}

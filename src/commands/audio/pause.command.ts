import { singleton } from "tsyringe";
import MusicSubscription from "../../entity/audio/subscription.entity";
import { ICommand } from "../../interfaces/command.interface";

@singleton()
export default class PauseCommand implements ICommand<MusicSubscription> {
  public commandName: string = "pause";
  public commandDescription: string = "Pause playback";
  public commandParams: string[] = [];
  public async execute(subscription: MusicSubscription, args: string[]) {
    await subscription.processPauseCommand();
  }
}

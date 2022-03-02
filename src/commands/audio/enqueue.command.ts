import { singleton } from "tsyringe";
import MusicSubscription from "../../entity/audio/subscription.entity";
import { ICommand } from "../../interfaces/command.interface";

@singleton()
export default class EnqueueCommand implements ICommand<MusicSubscription> {
  public commandName: string = "enqueue";
  public commandDescription: string = "Add song to queue";
  public commandParams: string[] = ["url/search query"];

  public async execute(subscription: MusicSubscription, args: string[]) {
    const videoQuery = args.slice(2).join(" ");
    await subscription.processEnqueueCommand(videoQuery);
  }
}

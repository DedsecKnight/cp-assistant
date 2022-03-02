import { singleton } from "tsyringe";
import MusicSubscription from "../../entity/audio/subscription.entity";
import { ICommand } from "../../interfaces/command.interface";

@singleton()
export default class QueueListCommand implements ICommand<MusicSubscription> {
  public commandName: string = "list";
  public commandDescription: string = "List all song currently in queue";
  public commandParams: string[] = [];
  public async execute(subscription: MusicSubscription, args: string[]) {
    await subscription.processListQueueCommand();
  }
}

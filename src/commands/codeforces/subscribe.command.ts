import { Message } from "discord.js";
import { singleton, injectable } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import CFSubscriptionService from "../../services/codeforces/subscription.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class SubscribeCommand implements ICommand<Message> {
  public commandName: string = "subscribe";
  public commandDescription: string =
    "Use this command to subscribe to a Codeforces handle. You can keep track of their submissions through this command.";
  public commandParams: string[] = ["handle"];

  constructor(
    private messageService: MessageService,
    private subscriptionService: CFSubscriptionService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (args.length !== 3) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Handle is required. Please try again",
      });
    }

    const discordId = message.author.id;
    const handle = args[2];

    const { statusCode, msg } = this.subscriptionService.subscribe({
      discordId,
      handle,
      channelObj: message.channel,
    });

    if (statusCode !== 200) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "YELLOW",
        description: msg,
      });
    }

    return this.messageService.sendEmbedMessage(message.channel, {
      color: "GREEN",
      title: "Subscription sucessful",
      description: `<@${message.author.id}> has subscribed to ${handle}`,
    });
  }
}

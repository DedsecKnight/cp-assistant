import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { Embed } from "../../entity/utilities/embed.entity";
import { ICommand } from "../../interfaces/command.interface";
import CFSubscriptionService from "../../services/codeforces/subscription.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class SubscriptionCommand implements ICommand<Message> {
  public commandName: string = "subscription";
  public commandDescription: string =
    "Use this command to view your subscription";
  public commandParams: string[] = [];

  constructor(
    private subscriptionService: CFSubscriptionService,
    private messageService: MessageService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    const discordId = message.author.id;
    const subscriptions =
      this.subscriptionService.getUserSubscription(discordId);

    const embed: Partial<Embed> = {
      title: `${message.author.username}'s Subscription`,
    };

    if (subscriptions.length === 0) {
      embed.description = "No subscription found";
    } else {
      embed.fields = subscriptions.map((subscription) => ({
        name: "Handle",
        value: subscription,
      }));
    }

    return this.messageService.sendEmbedMessage(message.channel, embed);
  }
}

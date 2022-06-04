import { CacheType, CommandInteraction } from "discord.js";
import { injectable, singleton } from "tsyringe";
import RandomCommand from "../../commands/codeforces/random.command";
import SubscribeCommand from "../../commands/codeforces/subscribe.command";
import SubscriptionCommand from "../../commands/codeforces/subscription.command";
import UnsubscribeCommand from "../../commands/codeforces/unsubscribe.command";
import UpdateCommand from "../../commands/codeforces/update.command";
import { ISlashCommand } from "../../interfaces/slash.command.interface";
import { SlashService } from "../../interfaces/slash.service.interface";

@injectable()
@singleton()
export default class CodeforcesService extends SlashService {
  public serviceName: string = "cf";
  public serviceDescription: string = "Codeforces Service";

  constructor(
    randomCommand: RandomCommand,
    updateCommand: UpdateCommand,
    subscribeCommand: SubscribeCommand,
    unsubscribeCommand: UnsubscribeCommand,
    subscriptionCommand: SubscriptionCommand
  ) {
    super(
      randomCommand,
      updateCommand,
      subscribeCommand,
      unsubscribeCommand,
      subscriptionCommand
    );
    this.initializeSlashBuilder(Array.from(arguments) as ISlashCommand[]);
  }

  public process(interaction: CommandInteraction<CacheType>) {
    const subcommand = interaction.options.getSubcommand();
    return this.serviceContainer[subcommand].execute(interaction);
  }
}

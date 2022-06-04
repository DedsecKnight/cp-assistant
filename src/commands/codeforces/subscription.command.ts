import { CommandInteraction, CacheType, MessageEmbedOptions } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import CFSubscriptionService from "../../services/codeforces/subscription.service";

@injectable()
@singleton()
export default class SubscriptionCommand implements ISlashCommand {
  public commandName: string = "subscription";
  public commandDescription: string =
    "Use this command to view your subscription";
  public commandParams: SlashCommandParam[] = [];

  constructor(private subscriptionService: CFSubscriptionService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const discordId = interaction.user.id;
    const subscriptions =
      this.subscriptionService.getUserSubscription(discordId);

    const embedConfig: MessageEmbedOptions = {
      title: `${interaction.user.username}'s Subscription`,
    };

    if (subscriptions.length === 0) {
      embedConfig.description = "No subscription found";
    } else {
      embedConfig.fields = subscriptions.map((subscription) => ({
        name: "Handle",
        value: subscription,
      }));
    }

    return interaction.reply({ embeds: [embedConfig], ephemeral: true });
  }
}

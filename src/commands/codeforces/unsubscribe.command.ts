import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import CFSubscriptionService from "../../services/codeforces/subscription.service";

@injectable()
@singleton()
export default class UnsubscribeCommand implements ISlashCommand {
  public commandName: string = "unsubscribe";
  public commandDescription: string =
    "Use this command to unsubscribe from a handle";
  public commandParams: SlashCommandParam[] = [
    { paramName: "handle", paramDescription: "CF Handle", paramRequired: true },
  ];

  constructor(private subscriptionService: CFSubscriptionService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const discordId = interaction.user.id;
    const handle = interaction.options.getString("handle")!;

    const { statusCode, msg } = this.subscriptionService.unsubscribe({
      discordId,
      handle,
    });

    if (statusCode !== 200) {
      return interaction.reply({
        embeds: [
          {
            color: "YELLOW",
            description: msg,
          },
        ],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [
        {
          color: "GREEN",
          title: "Unsubscription sucessful",
          description: `${interaction.user.toString()} has unsubscribed to ${handle}`,
        },
      ],
      ephemeral: true,
    });
  }
}

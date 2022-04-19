import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../../interfaces/slash.command.interface";
import CFSubscriptionService from "../../../services/codeforces/subscription.service";

@injectable()
@singleton()
export default class SubscribeCommand implements ISlashCommand {
  public commandName: string = "subscribe";
  public commandDescription: string =
    "Subscribe to a Codeforces handle to keep track of their submissions.";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "handle",
      paramDescription: "Subscribee's CF Handle",
      paramRequired: true,
    },
  ];

  constructor(private subscriptionService: CFSubscriptionService) {}
  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const discordId = interaction.user.id;
    const handle = interaction.options.getString("handle")!;

    const { statusCode, msg } = this.subscriptionService.subscribe({
      discordId,
      handle,
      channelObj: interaction.user.dmChannel!,
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
          title: "Subscription successful",
          description: `${interaction.user.toString()} has subscribed to ${handle}`,
        },
      ],
      ephemeral: true,
    });
  }
}

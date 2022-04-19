import { CommandInteraction, CacheType, MessageEmbedOptions } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import CodeforcesUtilsService from "../../services/codeforces/utilities.service";

@injectable()
@singleton()
export default class UpdateCommand implements ISlashCommand {
  public commandName: string = "update";
  public commandDescription: string =
    "Use this command to update the problem database";
  public commandParams: SlashCommandParam[] = [];

  constructor(private cfUtilsService: CodeforcesUtilsService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const embedConfig: MessageEmbedOptions = {
      color: "YELLOW",
      title: "Updating problem database",
    };

    await interaction.reply({ embeds: [embedConfig] });

    const { statusCode } = await this.cfUtilsService.updateProblemDatabase();
    if (statusCode !== 200) {
      embedConfig.color = "RED";
      embedConfig.title = "Unexpected error occurred. Please try again later.";
    } else {
      embedConfig.color = "GREEN";
      embedConfig.title = "Problem Database updated";
    }
    return interaction.editReply({ embeds: [embedConfig] });
  }
}

import { CommandInteraction, CacheType, MessageEmbedOptions } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";

@singleton()
@injectable()
export default class UpdateCommand implements ISlashCommand {
  public commandName: string = "update";
  public commandDescription: string =
    "Use this command to update the problem database.";
  public commandParams: SlashCommandParam[] = [];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const embedConfig: MessageEmbedOptions = {
      title: "Updating problem database...",
      color: "YELLOW",
    };

    await interaction.reply({ embeds: [embedConfig] });

    await this.kattisUtilsService.updateKattisProblemDatabase();

    embedConfig.title = "Problem database updated!";
    embedConfig.color = "GREEN";

    return interaction.editReply({ embeds: [embedConfig] });
  }
}

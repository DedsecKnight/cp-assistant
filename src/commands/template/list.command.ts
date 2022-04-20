import { CommandInteraction, CacheType, MessageEmbedOptions } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import TemplateDatabaseService from "../../services/template/database.service";

@singleton()
@injectable()
export default class ListTemplateCommand implements ISlashCommand {
  public commandName: string = "list";
  public commandDescription: string = "List all templates that user has";
  public commandParams: SlashCommandParam[] = [];

  constructor(private databaseService: TemplateDatabaseService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const guildId = interaction.guild ? interaction.guild.id : "";
    const userId = interaction.user.id;

    const templates = await this.databaseService.getTemplatesByUser(
      userId,
      guildId
    );

    const embedConfig: MessageEmbedOptions = {
      color: "#0099ff",
      title: `${interaction.user.toString()}'s template repository`,
    };

    if (templates.length === 0) {
      embedConfig.description = "No template found";
    }

    embedConfig.fields = templates.map((template, idx) => ({
      name: `Template #${idx + 1}`,
      value: template.fileName,
    }));

    return interaction.reply({ embeds: [embedConfig] });
  }
}

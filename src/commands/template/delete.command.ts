import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import TemplateDatabaseService from "../../services/template/database.service";

@singleton()
@injectable()
export default class DeleteTemplateCommand implements ISlashCommand {
  public commandName: string = "delete";
  public commandDescription: string = "Delete template with specified filename";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "filename",
      paramDescription: "Name of template file",
      paramRequired: true,
    },
  ];

  constructor(private databaseService: TemplateDatabaseService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const fileName = interaction.options.getString("filename")!;
    const template = await this.databaseService.getUserTemplate(
      interaction.user.id,
      interaction.guild ? interaction.guild.id : "",
      fileName
    );

    if (!template) {
      return interaction.reply({
        embeds: [
          {
            color: "RED",
            description:
              "Cannot find requested template. Please check your filename",
          },
        ],
      });
    }

    await this.databaseService.deleteTemplate(template._id);
    return interaction.reply({
      embeds: [
        {
          color: "GREEN",
          description: `${fileName} deleted from ${interaction.user.toString()}'s repository`,
        },
      ],
    });
  }
}

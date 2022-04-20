import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import TemplateDatabaseService from "../../services/template/database.service";
import FileService from "../../services/utilities/file.service";
import fs from "fs";

@injectable()
@singleton()
export default class GetTemplateCommand implements ISlashCommand {
  public commandName: string = "get";
  public commandDescription: string = "Get a template by filename";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "filename",
      paramDescription: "Name of template file",
      paramRequired: true,
    },
  ];

  constructor(
    private databaseService: TemplateDatabaseService,
    private fileService: FileService
  ) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const userId = interaction.user.id;
    const guildId = interaction.guild ? interaction.guild.id : "";
    const fileName = interaction.options.getString("filename")!;
    const template = await this.databaseService.getUserTemplate(
      userId,
      guildId,
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

    const filePath = await this.fileService.createFile(
      guildId,
      userId,
      fileName,
      template.templateData
    );
    await interaction.reply({
      files: [filePath],
    });

    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(`Error cleaning up ${filePath}`);
          console.error(err);
        }
      });
    }, 20000);
  }
}

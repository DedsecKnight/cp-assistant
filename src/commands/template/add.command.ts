import axios from "axios";
import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import TemplateDatabaseService from "../../services/template/database.service";

@injectable()
@singleton()
export default class AddTemplateCommand implements ISlashCommand {
  public commandName: string = "add";
  public commandDescription: string =
    "Add a new template. If template with same name already exists, the old one will be overwritten.";
  public commandParams: SlashCommandParam[] = [];

  constructor(private databaseService: TemplateDatabaseService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    await interaction.reply({
      embeds: [
        {
          description:
            "Please upload all template codes you want to store within 20 seconds",
          color: "BLUE",
        },
      ],
      fetchReply: true,
    });

    interaction
      .channel!.awaitMessages({
        filter: (response) =>
          response.attachments.size > 0 &&
          response.author.id === interaction.user.id,
        max: 1,
        time: 20000,
        errors: ["time"],
      })
      .then(async (collected) => {
        const attachments = collected.first()!.attachments;
        await Promise.all(
          attachments.mapValues(async (attachment) => {
            const { data: templateData } = await axios.get(attachment.url);
            const fileName = attachment.name!;
            return this.databaseService.updateUserTemplate(
              interaction.user.id,
              interaction.guild ? interaction.guild.id : "",
              templateData,
              fileName
            );
          })
        );
        return interaction.followUp({
          embeds: [
            { color: "GREEN", description: "Template added to database" },
          ],
        });
      })
      .catch((_) => {
        return interaction.followUp({
          embeds: [{ description: "No files found!", color: "RED" }],
        });
      });
  }
}

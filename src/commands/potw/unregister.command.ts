import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import POTWDatabaseService from "../../services/potw/database.service";
import POTWUtilsService from "../../services/potw/utilities.service";

@singleton()
@injectable()
export default class UnregisterChannelCommand implements ISlashCommand {
  public commandName: string = "unregister";
  public commandDescription: string =
    "Use this command to unregister channel from POTW";
  public commandParams: SlashCommandParam[] = [];

  constructor(
    private utilsService: POTWUtilsService,
    private databaseService: POTWDatabaseService
  ) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    this.utilsService.unsubscribeChannel(interaction.channel!);
    await this.databaseService.removeChannel(interaction.channel!.id);
    const announcementEmbed = new MessageEmbed({
      title: "Channel unregistered",
      description:
        "This channel is successfully unregistered from the POTW service.",
      color: "GREEN",
    });
    return interaction.reply({
      embeds: [announcementEmbed],
    });
  }
}

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
export default class RegisterChannelCommand implements ISlashCommand {
  public commandName: string = "register";
  public commandDescription: string = "Register a text-based channel to POTW";
  public commandParams: SlashCommandParam[] = [];

  constructor(
    private utilsService: POTWUtilsService,
    private databaseService: POTWDatabaseService
  ) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    this.utilsService.subscribeChannel(interaction.channel!);
    await this.databaseService.addChannel(interaction.channel!);

    const announcementEmbed = new MessageEmbed({
      title: "Channel registered",
      description: `
        This channel is successfully registered to the POTW service. \n
        A Kattis problem will be sent to this channel at 4pm on the upcoming Wednesday. \n
        Those that have access to this channel will have until 4pm of the Wednesday after to submit their solution. \n
        To submit a solution, upload a file with the following name \`problemId.extension\`, where \`problemId\` is the problem ID, and \`extension\` can be either cpp, java, or py depending on language of choice. \n
        Good luck with POTW to all participants!
      `,
      color: "GREEN",
    });

    return interaction.reply({
      embeds: [announcementEmbed],
    });
  }
}

import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";
import { spoiler } from "@discordjs/builders";

@singleton()
@injectable()
export default class LoginCommand implements ISlashCommand {
  public commandName: string = "login";
  public commandDescription: string =
    "Use this command to login into Kattis. Please use this command through DM.";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "username",
      paramDescription: "Kattis Username",
      paramRequired: true,
    },
    {
      paramName: "password",
      paramDescription: "Kattis Password",
      paramRequired: true,
    },
  ];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");

    try {
      const secretKey = await this.kattisUtilsService.updateUserCredentials(
        interaction.member!.user.id,
        username!,
        password!
      );

      const successEmbed = new MessageEmbed({
        color: "GREEN",
        fields: [
          {
            name: "Click below to reveal your secret key",
            value: spoiler(secretKey),
          },
          {
            name: "Note",
            value: `Please make sure that only you will have access to this key. To regenerate it, please login again.`,
          },
        ],
      });

      return interaction.reply({
        embeds: [successEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      const errorEmbed = new MessageEmbed({
        color: "RED",
        description: "Login failed",
      });
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

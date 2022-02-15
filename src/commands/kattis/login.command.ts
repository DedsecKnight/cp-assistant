import { Message, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import KattisUtilsService from "../../services/kattis.utils.service";

@singleton()
@injectable()
export default class LoginCommand implements ICommand<Message> {
  public commandName: string = "login";
  public commandDescription: string =
    "Use this command to login into Kattis. Please use this command through DM.";
  public commandParams: string[] = ["username", "password"];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (message.channel.type !== "DM") {
      return message.channel.send("Please use this command in DM");
    }
    if (args.length < 4) {
      return message.author.send("Username and password is required to login");
    }
    const user = args[2];
    const password = args[3];

    try {
      const secretKey = await this.kattisUtilsService.updateUserCredentials(
        message.author.id,
        user,
        password
      );

      const embed = new MessageEmbed();
      embed.setColor("GREEN");

      embed.addField(
        "Click below to reveal your secret key",
        `\|\|\`${secretKey}\`\|\|`
      );
      embed.addField(
        "Note",
        `Please make sure that only you will have access to this key. To regenerate it, please login again.`
      );

      return message.author.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.author.send("Login failed");
    }
  }
}

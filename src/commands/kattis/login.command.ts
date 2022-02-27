import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class LoginCommand implements ICommand<Message> {
  public commandName: string = "login";
  public commandDescription: string =
    "Use this command to login into Kattis. Please use this command through DM.";
  public commandParams: string[] = ["username", "password"];

  constructor(
    private kattisUtilsService: KattisUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (message.channel.type !== "DM") {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "YELLOW",
        description: "Please use this command in DM",
      });
    }
    if (args.length < 4) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Username and password is required to login",
      });
    }
    const user = args[2];
    const password = args[3];

    try {
      const secretKey = await this.kattisUtilsService.updateUserCredentials(
        message.author.id,
        user,
        password
      );

      return this.messageService.sendEmbedMessage(message.channel, {
        color: "GREEN",
        fields: [
          {
            name: "Click below to reveal your secret key",
            value: `\|\|\`${secretKey}\`\|\|`,
          },
          {
            name: "Note",
            value: `Please make sure that only you will have access to this key. To regenerate it, please login again.`,
          },
        ],
      });
    } catch (error) {
      console.error(error);
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Login failed",
      });
    }
  }
}

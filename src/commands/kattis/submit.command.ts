import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class SubmitCommand implements ICommand<Message> {
  public commandName: string = "submit";
  public commandDescription: string =
    "Submit your code to Kattis. Include solution file and secret key along with command message. Command will only works on DM.";
  public commandParams: string[] = ["problem_id", "secret_key"];

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
        description:
          "This command can only be used in DM. If you accidentally exposed your credentials on a public server, please update your credentials and login again",
      });
    }

    if (args.length < 3) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Problem ID is required",
      });
    }

    if (args.length < 4) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Secret key is required to use this functionality",
      });
    }

    const submissionFiles = message.attachments;
    if (submissionFiles.size < 1) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "At least 1 submission file is required. Please try again",
      });
    }

    if (submissionFiles.size > 1) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Only 1 file is allowed. Please try again.",
      });
    }

    const problemId = args[2].toLowerCase();
    const userSecretKey = args[3];
    const userData = await this.kattisUtilsService.getKattisUser(
      message.author.id
    );

    if (!userData) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Your credentials cannot be found. Please login again using `!kattis login` command",
      });
    }

    const { decryptedPassword, statusCode: decryptPasswordStatusCode } =
      this.kattisUtilsService.decryptKattisPassword(
        userData.kattisPassword,
        userSecretKey
      );

    if (decryptPasswordStatusCode !== 200) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Invalid secret key. Please make sure that the correct secret key is used",
      });
    }

    this.kattisUtilsService.processSubmitMesssage(
      userData.kattisUsername,
      decryptedPassword,
      problemId,
      message
    );
  }
}

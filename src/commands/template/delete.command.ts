import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import TemplateDatabaseService from "../../services/template/database.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class DeleteTemplateCommand implements ICommand<Message> {
  public commandName: string = "delete";
  public commandDescription: string = "Delete template with specified filename";
  public commandParams: string[] = ["filename"];

  constructor(
    private databaseService: TemplateDatabaseService,
    private messageService: MessageService
  ) {}

  public async execute(message: Message, args: string[]) {
    if (args.length < 2) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "A filename is required. Please try again",
      });
    }

    const userId = message.member!.user.id;
    const guildId = message.member!.guild.id;
    const fileName = args[2];

    const template = await this.databaseService.getUserTemplate(
      userId,
      guildId,
      fileName
    );

    if (!template) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Cannot find requested template. Please check your filename",
      });
    }

    await this.databaseService.deleteTemplate(template._id);
    return this.messageService.sendEmbedMessage(message.channel, {
      color: "GREEN",
      description: `${fileName} deleted from ${message.author.username}#${message.author.discriminator}'s repository`,
    });
  }
}

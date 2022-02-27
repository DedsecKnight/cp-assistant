import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import axios from "axios";
import MessageService from "../../services/utilities/message.service";
import TemplateDatabaseService from "../../services/template/database.service";

@singleton()
@injectable()
export default class AddTemplateCommand implements ICommand<Message> {
  public commandName: string = "add";
  public commandDescription: string =
    "Add a new template. If template with same name already exists, the old one will be overwritten. Attach template along with command message";
  public commandParams: string[] = [];

  constructor(
    private databaseService: TemplateDatabaseService,
    private messageService: MessageService
  ) {}

  public async execute(message: Message, args: string[]) {
    const channel = message.channel;
    if (message.attachments.size == 0) {
      return channel.send("No file found. Please attach at least 1 file");
    }
    const invalidFiles = message.attachments.filter((value, _) => {
      if (value.contentType?.indexOf("x-c++src") !== -1) return false;
      if (value.contentType?.indexOf("x-java") !== -1) return false;
      return true;
    });

    if (invalidFiles.size > 0) {
      return channel.send("Invalid file found. Please try again");
    }

    const userId = message.member!.user.id;
    const guildId = message.member!.guild.id;

    message.attachments.forEach(async (value, _) => {
      const { data: templateData } = await axios.get(value.url);
      const fileName = value.name!;
      await this.databaseService.updateUserTemplate(
        userId,
        guildId,
        templateData,
        fileName
      );
    });

    return this.messageService.sendEmbedMessage(channel, {
      color: "GREEN",
      description: "Template added to database",
    });
  }
}

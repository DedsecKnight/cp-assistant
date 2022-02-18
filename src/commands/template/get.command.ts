import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import DatabaseService from "../../services/database.service";
import FileService from "../../services/file.service";
import fs from "fs";
import MessageService from "../../services/message.service";

@singleton()
@injectable()
export default class GetTemplateCommand implements ICommand<Message> {
  public commandName: string = "get";
  public commandDescription: string = "Get a template by filename";
  public commandParams: string[] = ["filename"];

  constructor(
    private databaseService: DatabaseService,
    private fileService: FileService,
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

    const filePath = await this.fileService.createFile(
      guildId,
      userId,
      fileName,
      template.templateData
    );
    await message.channel.send({
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

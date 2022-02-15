import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import DatabaseService from "../../services/database.service";

@singleton()
@injectable()
export default class DeleteTemplateCommand implements ICommand<Message> {
  public commandName: string = "delete";
  public commandDescription: string = "Delete template with specified filename";
  public commandParams: string[] = ["filename"];

  constructor(private databaseService: DatabaseService) {}

  public async execute(message: Message, args: string[]) {
    if (args.length < 2) {
      return message.reply("A filename is required. Please try again");
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
      return message.reply(
        "Cannot find requested template. Please check your filename"
      );
    }

    await this.databaseService.deleteTemplate(template._id);
    return message.channel.send(
      `${fileName} deleted from ${message.author.username}#${message.author.discriminator}'s repository`
    );
  }
}

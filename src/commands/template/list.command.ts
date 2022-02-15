import { Message, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import DatabaseService from "../../services/database.service";

@singleton()
@injectable()
export default class ListTemplateCommand implements ICommand<Message> {
  public commandName: string = "list";
  public commandDescription: string = "List all templates that user has";
  public commandParams: string[] = [];

  constructor(private databaseService: DatabaseService) {}

  public async execute(message: Message<boolean>, args: string[]) {
    const guildId = message.member!.guild.id;
    const userId = message.member!.user.id;
    const channel = message.channel;

    const templates = await this.databaseService.getTemplatesByUser(
      userId,
      guildId
    );

    const embed = new MessageEmbed();
    embed.setColor("#0099ff");
    embed.setTitle(
      `${message.author.username}#${message.author.discriminator}'s template repository`
    );

    if (templates.length === 0) {
      embed.setDescription("No template found");
    }

    templates.forEach((template, idx) => {
      embed.addField(`Template #${idx + 1}`, template.fileName);
    });

    return channel.send({
      embeds: [embed],
    });
  }
}

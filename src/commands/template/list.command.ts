import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { Embed } from "../../entity/embed.entity";
import { ICommand } from "../../interfaces/command.interface";
import TemplateDatabaseService from "../../services/template/database.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class ListTemplateCommand implements ICommand<Message> {
  public commandName: string = "list";
  public commandDescription: string = "List all templates that user has";
  public commandParams: string[] = [];

  constructor(
    private databaseService: TemplateDatabaseService,
    private messageService: MessageService
  ) {}

  public async execute(message: Message<boolean>, args: string[]) {
    const guildId = message.member!.guild.id;
    const userId = message.member!.user.id;
    const channel = message.channel;

    const templates = await this.databaseService.getTemplatesByUser(
      userId,
      guildId
    );

    const embedConfig: Partial<Embed> = {
      color: "#0099ff",
      title: `${message.author.username}#${message.author.discriminator}'s template repository`,
    };

    if (templates.length === 0) {
      embedConfig.description = "No template found";
    }

    embedConfig.fields = [];

    templates.forEach((template, idx) => {
      embedConfig.fields!.push({
        name: `Template #${idx + 1}`,
        value: template.fileName,
      });
    });

    return this.messageService.sendEmbedMessage(message.channel, embedConfig);
  }
}

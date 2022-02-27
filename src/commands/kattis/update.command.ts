import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { Embed } from "../../entity/embed.entity";
import { ICommand } from "../../interfaces/command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";
import MessageService from "../../services/utilities/message.service";

@injectable()
@singleton()
export default class UpdateCommand implements ICommand<Message> {
  public commandName: string = "update";
  public commandDescription: string =
    "Use this command to update the problem database.";
  public commandParams: string[] = [];

  constructor(
    private kattisUtilsService: KattisUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(message: Message, args: string[]): Promise<any> {
    const embedConfig: Partial<Embed> = {
      title: "Updating problem database...",
      color: "YELLOW",
    };

    const replyMessage = await this.messageService.sendEmbedMessage(
      message.channel,
      embedConfig
    );

    await this.kattisUtilsService.updateKattisProblemDatabase();

    embedConfig.title = "Problem database updated!";
    embedConfig.color = "GREEN";

    return this.messageService.editEmbedMessage(replyMessage, embedConfig);
  }
}

import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { Embed } from "../../entity/embed.entity";
import { ICommand } from "../../interfaces/command.interface";
import CodeforcesUtilsService from "../../services/codeforces/utilities.service";
import MessageService from "../../services/utilities/message.service";

@injectable()
@singleton()
export default class UpdateCommand implements ICommand<Message> {
  public commandName: string = "update";
  public commandDescription: string =
    "Use this command to update the problem database";
  public commandParams: string[] = [];

  constructor(
    private messageService: MessageService,
    private cfUtilsService: CodeforcesUtilsService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    const embedConfig: Partial<Embed> = {
      color: "YELLOW",
      title: "Updating problem database",
    };
    const replyMessage = await this.messageService.sendEmbedMessage(
      message.channel,
      embedConfig
    );
    const { statusCode } = await this.cfUtilsService.updateProblemDatabase();
    if (statusCode !== 200) {
      embedConfig.color = "RED";
      embedConfig.title = "Unexpected error occurred. Please try again later.";
    } else {
      embedConfig.color = "GREEN";
      embedConfig.title = "Problem Database updated";
    }
    return this.messageService.editEmbedMessage(replyMessage, embedConfig);
  }
}

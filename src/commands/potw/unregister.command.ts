import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import POTWUtilsService from "../../services/potw/utilities.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class UnregisterChannelCommand implements ICommand<Message> {
  public commandName: string = "unregister";
  public commandDescription: string =
    "Use this command to unregister the channel from POTW service.";
  public commandParams: string[] = [];

  constructor(
    private utilsService: POTWUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    this.utilsService.unsubscribeChannel(message.channel);
    return this.messageService.sendEmbedMessage(message.channel, {
      title: "Channel unregistered",
      description:
        "This channel is successfully unregistered from the POTW service.",
      color: "GREEN",
    });
  }
}

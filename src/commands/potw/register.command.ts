import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import POTWUtilsService from "../../services/potw/utilities.service";
import MessageService from "../../services/utilities/message.service";

@injectable()
@singleton()
export default class RegisterChannelCommand implements ICommand<Message> {
  public commandDescription: string =
    "Register a text-based channel to POTW service";
  public commandName: string = "register";
  public commandParams: string[] = [];

  constructor(
    private utilsService: POTWUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    this.utilsService.subscribeChannel(message.channel);
    return this.messageService.sendEmbedMessage(message.channel, {
      title: "Channel registered",
      description:
        "This channel is successfully registered to the POTW service.",
      color: "GREEN",
    });
  }
}

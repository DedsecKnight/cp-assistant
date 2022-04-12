import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import POTWDatabaseService from "../../services/potw/database.service";
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
    private messageService: MessageService,
    private databaseService: POTWDatabaseService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    this.utilsService.subscribeChannel(message.channel);
    await this.databaseService.addChannel(message.channel);
    const announcementMessage = await this.messageService.sendEmbedMessage(
      message.channel,
      {
        title: "Channel registered",
        description: `
        This channel is successfully registered to the POTW service. \n
        A Kattis problem will be sent to this channel at 4pm on the upcoming Wednesday. \n
        Those that have access to this channel will have until 4pm of the Wednesday after to submit their solution. \n
        To submit a solution, upload a file with the following name \`problemId.extension\`, where \`problemId\` is the problem ID, and \`extension\` can be either cpp, java, or py depending on language of choice. \n
        Good luck with POTW to all participants!
      `,
        color: "GREEN",
      }
    );
    await announcementMessage.pin();
  }
}

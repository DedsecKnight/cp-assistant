import { injectable, singleton } from "tsyringe";
import { Message } from "discord.js";
import { IService } from "../../interfaces/service.interface";
import RegisterChannelCommand from "../../commands/potw/register.command";
import UnregisterChannelCommand from "../../commands/potw/unregister.command";

@injectable()
@singleton()
export default class POTWService extends IService<Message> {
  public serviceName: string = "potw";
  public serviceDescription: string = "Problem of the Week Service";

  constructor(
    registerCommand: RegisterChannelCommand,
    unregisterCommand: UnregisterChannelCommand
  ) {
    super(registerCommand, unregisterCommand);
  }
  public async process(message: Message, args: string[]) {
    if (args.length <= 1) {
      return this.printServiceInfo(message, "ORANGE");
    }
    const commandName = args[1];
    if (!this.serviceContainer.hasOwnProperty(commandName)) {
      return message.reply("Command not found. Please try again");
    }
    await this.serviceContainer[commandName].execute(message, args);
  }
}

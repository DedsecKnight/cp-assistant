import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import LoginKattisCommand from "../../commands/kattis/login.command";
import ParseKattisContestCommand from "../../commands/kattis/parse.command";
import RandomKattisCommand from "../../commands/kattis/random.command";
import SubmitKattisCommand from "../../commands/kattis/submit.command";
import UpdateKattisCommand from "../../commands/kattis/update.command";
import { IService } from "../../interfaces/service.interface";

@singleton()
@injectable()
export default class KattisService extends IService<Message> {
  public serviceName: string = "kattis";
  public serviceDescription: string = "Kattis Service";

  constructor(
    parseCommand: ParseKattisContestCommand,
    loginCommand: LoginKattisCommand,
    submitCommand: SubmitKattisCommand,
    updateCommand: UpdateKattisCommand,
    randomCommand: RandomKattisCommand
  ) {
    super(
      parseCommand,
      loginCommand,
      submitCommand,
      updateCommand,
      randomCommand
    );
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

import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import RandomCommand from "../../commands/codeforces/random.command";
import UpdateCommand from "../../commands/codeforces/update.command";
import { IService } from "../../interfaces/service.interface";

@singleton()
@injectable()
export default class CodeforcesService extends IService<Message> {
  public serviceName: string = "cf";
  public serviceDescription: string = "Codeforces Service";

  constructor(updateCommand: UpdateCommand, randomCommand: RandomCommand) {
    super(updateCommand, randomCommand);
  }

  public async process(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (args.length <= 1) {
      return this.printServiceInfo(message, "BLUE");
    }
    const commandName = args[1];
    if (!this.serviceContainer.hasOwnProperty(commandName)) {
      return message.reply("Command not found. Please try again");
    }
    await this.serviceContainer[commandName].execute(message, args);
  }
}

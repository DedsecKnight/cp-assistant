import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import AddTemplateCommand from "../../commands/template/add.command";
import DeleteTemplateCommand from "../../commands/template/delete.command";
import GetTemplateCommand from "../../commands/template/get.command";
import ListTemplateCommand from "../../commands/template/list.command";
import { IService } from "../../interfaces/service.interface";

@injectable()
@singleton()
export default class TemplateService extends IService<Message> {
  public serviceName: string = "template";
  public serviceDescription: string = "Template Manager Service";

  constructor(
    addCommand: AddTemplateCommand,
    getCommand: GetTemplateCommand,
    listCommand: ListTemplateCommand,
    deleteCommand: DeleteTemplateCommand
  ) {
    super(addCommand, getCommand, listCommand, deleteCommand);
  }

  public async process(message: Message, args: string[]) {
    if (args.length <= 1) {
      return this.printServiceInfo(message);
    }
    const commandName = args[1];
    if (!this.serviceContainer.hasOwnProperty(commandName)) {
      return message.reply("Command not found. Please try again");
    }
    await this.serviceContainer[commandName].execute(message, args);
  }
}

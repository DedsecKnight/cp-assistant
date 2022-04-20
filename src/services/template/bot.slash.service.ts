import { CacheType, CommandInteraction } from "discord.js";
import { injectable, singleton } from "tsyringe";
import AddTemplateCommand from "../../commands/template/add.command";
import DeleteTemplateCommand from "../../commands/template/delete.command";
import GetTemplateCommand from "../../commands/template/get.command";
import ListTemplateCommand from "../../commands/template/list.command";
import { ISlashCommand } from "../../interfaces/slash.command.interface";
import { SlashService } from "../../interfaces/slash.service.interface";

@injectable()
@singleton()
export default class TemplateService extends SlashService {
  public serviceName: string = "template";
  public serviceDescription: string = "Template Service";

  constructor(
    addCommand: AddTemplateCommand,
    deleteCommand: DeleteTemplateCommand,
    getCommand: GetTemplateCommand,
    listCommand: ListTemplateCommand
  ) {
    super(addCommand, deleteCommand, getCommand, listCommand);
    this.initializeSlashBuilder(Array.from(arguments) as ISlashCommand[]);
  }

  public process(interaction: CommandInteraction<CacheType>) {
    const subcommand = interaction.options.getSubcommand();
    return this.serviceContainer[subcommand].execute(interaction);
  }
}

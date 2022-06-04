import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import RegisterChannelCommand from "../../commands/potw/register.command";
import UnregisterChannelCommand from "../../commands/potw/unregister.command";
import { ISlashCommand } from "../../interfaces/slash.command.interface";
import { SlashService } from "../../interfaces/slash.service.interface";

@injectable()
@singleton()
export default class POTWService extends SlashService {
  public serviceName: string = "potw";
  public serviceDescription: string = "POTW Service";

  constructor(
    registerCommand: RegisterChannelCommand,
    unregisterCommand: UnregisterChannelCommand
  ) {
    super(registerCommand, unregisterCommand);
    this.initializeSlashBuilder(Array.from(arguments) as ISlashCommand[]);
  }

  public process(interaction: CommandInteraction<CacheType>) {
    const subcommand = interaction.options.getSubcommand();
    return this.serviceContainer[subcommand].execute(interaction);
  }
}

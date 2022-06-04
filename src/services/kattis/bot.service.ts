import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import LoginCommand from "../../commands/kattis/login.command";
import ParseContestCommand from "../../commands/kattis/parse.command";
import RandomCommand from "../../commands/kattis/random.command";
import SubmitCommand from "../../commands/kattis/submit.command";
import UpdateCommand from "../../commands/kattis/update.command";
import { ISlashCommand } from "../../interfaces/slash.command.interface";
import { SlashService } from "../../interfaces/slash.service.interface";

@injectable()
@singleton()
export default class KattisService extends SlashService {
  public serviceName: string = "kattis";
  public serviceDescription: string = "Kattis Service";

  constructor(
    loginCommand: LoginCommand,
    parseCommand: ParseContestCommand,
    randomCommand: RandomCommand,
    updateCommand: UpdateCommand,
    submitCommand: SubmitCommand
  ) {
    super(
      loginCommand,
      parseCommand,
      randomCommand,
      updateCommand,
      submitCommand
    );
    this.initializeSlashBuilder(Array.from(arguments) as ISlashCommand[]);
  }

  public process(interaction: CommandInteraction<CacheType>) {
    const subcommand = interaction.options.getSubcommand();
    return this.serviceContainer[subcommand].execute(interaction);
  }
}

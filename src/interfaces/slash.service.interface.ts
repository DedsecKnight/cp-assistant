import { SlashCommandBuilder } from "@discordjs/builders";
import type { CommandInteraction } from "discord.js";
import { ISlashCommand } from "./slash.command.interface";

export abstract class SlashService {
  public abstract serviceName: string;
  public abstract serviceDescription: string;
  private slashBuilder: SlashCommandBuilder;
  protected serviceContainer: Record<string, ISlashCommand> = {};

  constructor(...commands: ISlashCommand[]) {
    commands.forEach((command) => {
      this.serviceContainer[command.commandName] = command;
    });
  }

  protected initializeSlashBuilder(commands: ISlashCommand[]): void {
    try {
      this.slashBuilder = new SlashCommandBuilder()
        .setName(this.serviceName)
        .setDescription(this.serviceDescription);
      commands.forEach((command) => {
        this.slashBuilder.addSubcommand((subcommand) => {
          const ret = subcommand
            .setName(command.commandName)
            .setDescription(command.commandDescription);

          command.commandParams.forEach(
            ({ paramName, paramDescription, paramRequired, paramType }) => {
              const optionFunc = (option: any) =>
                option
                  .setName(paramName)
                  .setDescription(paramDescription)
                  .setRequired(paramRequired);
              if (paramType === "BOOLEAN") ret.addBooleanOption(optionFunc);
              else if (paramType === "INTEGER")
                ret.addIntegerOption(optionFunc);
              else if (paramType === "NUMBER") ret.addNumberOption(optionFunc);
              else if (paramType === "USER") ret.addUserOption(optionFunc);
              else ret.addStringOption(optionFunc);
            }
          );
          return ret;
        });
      });
    } catch (error) {
      console.log("HERE");
      console.log(error);
      process.exit(1);
    }
  }
  public getSlashBuilder(): SlashCommandBuilder {
    return this.slashBuilder;
  }
  public abstract process(interaction: CommandInteraction): any;
}

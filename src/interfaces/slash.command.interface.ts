import type { CommandInteraction } from "discord.js";

export interface SlashCommandParam {
  paramName: string;
  paramDescription: string;
  paramRequired: boolean;
  paramType?: "INTEGER" | "NUMBER" | "STRING" | "BOOLEAN" | "USER";
}

export interface ISlashCommand {
  commandName: string;
  commandDescription: string;
  commandParams: SlashCommandParam[];
  execute(interaction: CommandInteraction): Promise<any>;
}

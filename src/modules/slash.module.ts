import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { SlashService } from "../interfaces/slash.service.interface";
import CodeforcesService from "../services/codeforces/bot.service";
import KattisService from "../services/kattis/bot.service";
import POTWService from "../services/potw/bot.service";

@injectable()
@singleton()
export default class SlashCommandModule {
  private discordRest: REST;
  private commands: any[] = [];
  private serviceMapping: Record<string, SlashService>;

  constructor(
    potwService: POTWService,
    kattisService: KattisService,
    codeforcesService: CodeforcesService
  ) {
    this.discordRest = new REST({ version: "9" }).setToken(
      process.env.DISCORD_TOKEN!
    );
    this.serviceMapping = Array.from(arguments).reduce(
      (acc: typeof this.serviceMapping, curr: SlashService) => {
        this.commands.push(curr.getSlashBuilder().toJSON());
        return {
          ...acc,
          [curr.serviceName]: curr,
        };
      },
      {} as typeof this.serviceMapping
    );
  }
  public async initializeSlashCommands(clientId: string) {
    if (process.env.NODE_ENV === "production") {
      await this.discordRest.put(Routes.applicationCommands(clientId), {
        body: this.commands,
      });
    } else {
      await this.discordRest.put(
        Routes.applicationGuildCommands(clientId, process.env.DEV_GUILD_ID!),
        { body: this.commands }
      );
    }
  }
  public async processSlashCommand(interaction: CommandInteraction) {
    if (!this.serviceMapping.hasOwnProperty(interaction.commandName)) {
      const embed = new MessageEmbed()
        .setColor("RED")
        .setTitle("Invalid command");
      return interaction.reply({
        embeds: [embed],
      });
    }
    return this.serviceMapping[interaction.commandName].process(interaction);
  }
}

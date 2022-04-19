import { CommandInteraction, CacheType, MessageEmbedOptions } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import CodeforcesUtilsService from "../../services/codeforces/utilities.service";

@singleton()
@injectable()
export default class RandomCommand implements ISlashCommand {
  public commandName: string = "random";
  public commandDescription: string =
    "Use this command to generate a random command based on provided specification";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "min_rating",
      paramDescription: "Lower bound for problem rating",
      paramRequired: false,
    },
    {
      paramName: "max_rating",
      paramDescription: "Upper bound for problem rating",
      paramRequired: false,
    },
    {
      paramName: "topic",
      paramDescription: "Problem Topic",
      paramRequired: false,
    },
  ];

  constructor(private cfUtilsService: CodeforcesUtilsService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const minRating = interaction.options.getString("min_rating")
      ? parseInt(interaction.options.getString("min_rating")!)
      : 800;
    const maxRating = interaction.options.getString("max_rating")
      ? parseInt(interaction.options.getString("max_rating")!)
      : 4000;
    const topic = interaction.options.getString("topic") || "";

    const embedConfig: MessageEmbedOptions = {};

    if (isNaN(minRating) || isNaN(maxRating) || minRating > maxRating) {
      embedConfig.color = "RED";
      embedConfig.description =
        "Invalid rating configuration. Please try again.";
      return interaction.reply({ embeds: [embedConfig] });
    }

    try {
      const problem = await this.cfUtilsService.generateRandomProblem({
        minRating,
        maxRating,
        topic,
      });
      if (!problem) {
        embedConfig.color = "RED";
        embedConfig.description =
          "No such problem found. Please adjust the difficulty range";
        return interaction.reply({ embeds: [embedConfig] });
      }
      return interaction.reply({
        embeds: [
          {
            color: "BLUE",
            title: "Random Problem",
            fields: [
              { name: "Problem Name", value: problem.name, inline: true },
              {
                name: "Problem Difficulty",
                value: problem.rating.toString(),
                inline: true,
              },
              {
                name: "Problem URL",
                value: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
              },
            ],
          },
        ],
      });
    } catch (error) {
      return interaction.reply({
        embeds: [
          {
            color: "RED",
            description:
              "Service is unavailable at the moment. Please try again later",
          },
        ],
      });
    }
  }
}

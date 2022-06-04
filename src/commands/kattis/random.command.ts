import { CommandInteraction, CacheType, MessageEmbedOptions } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";

@injectable()
@singleton()
export default class RandomCommand implements ISlashCommand {
  public commandName: string = "random";
  public commandDescription: string =
    "Generate a random problem within a provided range of difficulty.";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "lower_bound",
      paramDescription: "Lower bound for difficulty",
      paramRequired: false,
      paramType: "NUMBER",
    },
    {
      paramName: "upper_bound",
      paramDescription: "Upper bound for difficulty",
      paramRequired: false,
      paramType: "NUMBER",
    },
  ];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const lowBound = interaction.options.getNumber("lower_bound") || 0.0;
    const highBound = interaction.options.getNumber("upper_bound") || 10.0;

    const embedConfig: MessageEmbedOptions = {};

    if (lowBound > highBound) {
      embedConfig.color = "RED";
      embedConfig.description =
        "Invalid value for difficulty bound(s). Please try again.";
      return interaction.reply({
        embeds: [embedConfig],
      });
    }

    const problem = await this.kattisUtilsService.fetchRandomProblem(
      lowBound,
      highBound
    );
    if (!problem) {
      embedConfig.color = "RED";
      embedConfig.description =
        "No such problem found. Please adjust the difficulty range";
      return interaction.reply({
        embeds: [embedConfig],
      });
    }

    embedConfig.color = "ORANGE";
    embedConfig.title = "Random Problem";
    embedConfig.fields = [
      { name: "Problem Name", value: problem.name, inline: true },
      {
        name: "Problem Difficulty",
        value: problem.difficulty.toFixed(1).toString(),
        inline: true,
      },
      {
        name: "Problem URL",
        value: `${process.env.KATTIS_PROBLEM_URL!}/${problem.problemId}`,
      },
    ];

    return interaction.reply({
      embeds: [embedConfig],
    });
  }
}

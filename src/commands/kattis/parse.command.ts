import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import { parse } from "node-html-parser";
import axios from "axios";
import { KattisContestProblem } from "../../entity/kattis/problem.entity";
import KattisUtilsService from "../../services/kattis/utilities.service";

@singleton()
@injectable()
export default class ParseContestCommand implements ISlashCommand {
  public commandName: string = "parse";
  public commandDescription: string = "Parse a contest with given contest ID";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "contest_id",
      paramDescription: "ID of parsed contest",
      paramRequired: true,
    },
  ];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  private async fetchDataFromContest(contestId: string): Promise<
    WithResponseStatusCode<{
      contestName: string;
      problems: Omit<KattisContestProblem, "problemId">[];
    }>
  > {
    try {
      const { data: htmlData } = await axios.get(
        `https://open.kattis.com/contests/${contestId}/problems`
      );
      const parsedHtml = parse(htmlData);
      const contestName = parsedHtml
        .querySelector("div.contest-title")!
        .querySelector("h2")!
        .innerText.trim();
      const problemEntries = parsedHtml
        .querySelector("tbody")!
        .querySelectorAll("tr");

      const problems = await Promise.all(
        problemEntries.map(async (entry) => {
          const letter = entry.querySelector("th")!.innerText.trim();
          const name = entry
            .querySelector("td")!
            .querySelector("a")!
            .innerText.trim();

          const id = entry
            .querySelector("td")!
            .querySelector("a")!
            .getAttribute("href")!
            .split("/")
            .slice(-1)[0];
          const problemData = await this.kattisUtilsService.getProblemById(id);

          return {
            difficulty: problemData!.difficulty,
            letter,
            name,
          };
        })
      );

      problems.sort((l, r) => l.difficulty - r.difficulty);

      return {
        statusCode: 200,
        contestName,
        problems,
      };
    } catch (error) {
      return {
        statusCode: 400,
        contestName: "",
        problems: [],
      };
    }
  }

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const contestId = interaction.options.getString("contest_id")!;

    const { statusCode, contestName, problems } =
      await this.fetchDataFromContest(contestId);

    if (statusCode !== 200) {
      const errorEmbed = new MessageEmbed({
        color: "ORANGE",
        description:
          "Contest is not parseable. Please try again with another contest ID",
      });
      return interaction.reply({
        embeds: [errorEmbed],
      });
    }

    await interaction.reply({
      embeds: [
        new MessageEmbed({
          color: "ORANGE",
          title: "Fetching problem data...",
        }),
      ],
    });

    const problemList = problems.map((problem) => ({
      name: `Problem ${problem.letter}: ${problem.name}`,
      value: problem.difficulty.toString(),
    }));

    return interaction.editReply({
      embeds: [
        new MessageEmbed({
          color: "ORANGE",
          title: contestName,
          fields: problemList,
        }),
      ],
    });
  }
}

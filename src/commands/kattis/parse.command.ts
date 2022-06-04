import { CommandInteraction, CacheType, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import { parse } from "node-html-parser";
import axios from "axios";
import { KattisContestProblem } from "../../entity/kattis/problem.entity";

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

  private async getProblemUrls(contestId: string): Promise<
    WithResponseStatusCode<{
      contestName: string;
      problemLinks: Array<{ problemLink: string; letter: string }>;
    }>
  > {
    try {
      const { data: htmlData } = await axios.get(
        `${process.env.KATTIS_CONTEST_URL!}/${contestId}/problems`
      );
      const parsedPage = parse(htmlData);
      const contestName = parsedPage.querySelector("h2.title")!.innerText;
      const problems = parsedPage
        .querySelector("#contest_problem_list")
        ?.querySelector("tbody")
        ?.querySelectorAll("tr")
        .map((obj, idx: number) => {
          const contestProblemUrl = obj
            .querySelector("td")
            ?.querySelector("a")
            ?.getAttribute("href");
          const startIndex = contestProblemUrl!.indexOf("/problems");
          const problemLink = `${process.env
            .KATTIS_BASE_URL!}${contestProblemUrl?.substring(startIndex)}`;
          return { problemLink, letter: String.fromCharCode(65 + idx) };
        });

      return {
        statusCode: 200,
        contestName,
        problemLinks: problems || [],
      };
    } catch (error) {
      return {
        statusCode: 400,
        contestName: "",
        problemLinks: [],
      };
    }
  }

  private async getProblemData(
    problemUrl: string,
    problemLetter: string
  ): Promise<Partial<KattisContestProblem>> {
    const { data: htmlData } = await axios.get(problemUrl);
    const parsedPage = parse(htmlData);
    const problemDifficulty = parsedPage
      .querySelector("div.problem-sidebar.sidebar-info")!
      .querySelectorAll("div.sidebar-info")[1]
      .querySelectorAll("p")[3]
      .innerText.split(" ")[2];
    const problemName = parsedPage.querySelector(
      "div.headline-wrapper"
    )?.innerText;
    return {
      letter: problemLetter,
      difficulty: parseFloat(problemDifficulty),
      name: problemName!,
    };
  }

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    const contestId = interaction.options.getString("contest_id")!;

    const { statusCode, contestName, problemLinks } = await this.getProblemUrls(
      contestId
    );

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

    const problemList = [];

    for (let { problemLink, letter } of problemLinks) {
      const {
        letter: problemLetter,
        difficulty,
        name,
      } = await this.getProblemData(problemLink, letter);
      problemList.push({
        name: `Problem ${problemLetter}: ${name}`,
        value: difficulty!.toString(),
      });
    }

    problemList.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

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

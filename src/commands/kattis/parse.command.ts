import { Message, MessageEmbed } from "discord.js";
import { singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import { parse } from "node-html-parser";
import axios from "axios";
import { KattisContestProblem } from "../../entity/problem.kattis.entity";

@singleton()
export default class ParseContestCommand implements ICommand<Message> {
  public commandName: string = "parse";
  public commandDescription: string = "Parse a contest with given id";
  public commandParams: string[] = ["contest_id"];

  private async getProblemUrls(contestId: string) {
    const { data: htmlData } = await axios.get(
      `${process.env.KATTIS_CONTEST_URL!}/${contestId}/problems`
    );
    const parsedPage = parse(htmlData);
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

    return problems!;
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

  private checkContestParsable(contestId: string) {
    return true;
  }

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (args.length < 3) {
      return message.channel.send("Contest ID is required");
    }
    const contestId = args[2];
    if (!this.checkContestParsable(contestId)) {
      return message.channel.send(
        "Contest is not parseable. Please try again with another contest ID"
      );
    }

    const problemLinks = await this.getProblemUrls(contestId);
    const embed = new MessageEmbed();

    for (let { problemLink, letter } of problemLinks) {
      const {
        letter: problemLetter,
        difficulty,
        name,
      } = await this.getProblemData(problemLink, letter);
      embed.addField(
        `Problem ${problemLetter}: ${name}`,
        difficulty!.toString()
      );
    }

    return message.channel.send({ embeds: [embed] });
  }
}

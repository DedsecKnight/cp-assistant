import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import { parse } from "node-html-parser";
import axios from "axios";
import { KattisContestProblem } from "../../entity/kattis/problem.entity";
import { Embed } from "../../entity/utilities/embed.entity";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class ParseContestCommand implements ICommand<Message> {
  public commandName: string = "parse";
  public commandDescription: string = "Parse a contest with given contest ID.";
  public commandParams: string[] = ["contest_id"];

  constructor(private messageService: MessageService) {}

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
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (args.length < 3) {
      return message.channel.send("Contest ID is required");
    }
    const contestId = args[2];

    const { statusCode, contestName, problemLinks } = await this.getProblemUrls(
      contestId
    );

    const embedConfig: Partial<Embed> = {
      color: "ORANGE",
    };

    if (statusCode !== 200) {
      return this.messageService.sendEmbedMessage(message.channel, {
        ...embedConfig,
        description:
          "Contest is not parseable. Please try again with another contest ID",
      });
    }

    embedConfig.title = "Fetching problem data...";
    embedConfig.fields = [];
    const replyMessage = await this.messageService.sendEmbedMessage(
      message.channel,
      embedConfig
    );

    for (let { problemLink, letter } of problemLinks) {
      const {
        letter: problemLetter,
        difficulty,
        name,
      } = await this.getProblemData(problemLink, letter);
      embedConfig.fields.push({
        name: `Problem ${problemLetter}: ${name}`,
        value: difficulty!.toString(),
      });
    }

    embedConfig.title = contestName;

    return this.messageService.editEmbedMessage(replyMessage, embedConfig);
  }
}

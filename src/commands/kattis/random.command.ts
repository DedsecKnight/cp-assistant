import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class RandomCommand implements ICommand<Message> {
  public commandName: string = "random";
  public commandDescription: string =
    "Generate a random problem within a provided range of difficulty.";
  public commandParams: string[] = [
    "low_bound_difficulty",
    "high_bound_difficulty",
  ];

  constructor(
    private kattisUtilsService: KattisUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    const lowBound = parseFloat(args[2]);
    const highBound = parseFloat(args[3]);

    if (isNaN(lowBound) || isNaN(highBound) || lowBound > highBound) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Invalid value for difficulty bound(s). Please try again.",
      });
    }

    const problem = await this.kattisUtilsService.fetchRandomProblem(
      lowBound,
      highBound
    );

    if (!problem) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "No such problem found. Please adjust the difficulty range",
      });
    }

    return this.messageService.sendEmbedMessage(message.channel, {
      color: "ORANGE",
      title: "Random Problem",
      fields: [
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
      ],
    });
  }
}

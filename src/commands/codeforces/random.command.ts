import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import CodeforcesUtilsService from "../../services/codeforces/utilities.service";
import MessageService from "../../services/utilities/message.service";

@singleton()
@injectable()
export default class RandomCommand implements ICommand<Message> {
  public commandName: string = "random";
  public commandDescription: string =
    "Use this command to generate a random command based on provided specification";
  public commandParams: string[] = ["min_rating", "max_rating", "topic"];

  constructor(
    private utilsService: CodeforcesUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (args.length !== 5) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "5 arguments is required",
      });
    }

    const minRating = parseInt(args[2]);
    const maxRating = parseInt(args[3]);

    if (isNaN(minRating) || isNaN(maxRating) || minRating > maxRating) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Invalid rating configuration. Please try again.",
      });
    }

    try {
      const problem = await this.utilsService.generateRandomProblem({
        minRating,
        maxRating,
        topic: args[4],
      });
      if (!problem) {
        return this.messageService.sendEmbedMessage(message.channel, {
          color: "RED",
          description:
            "No such problem found. Please adjust the difficulty range",
        });
      }
      return this.messageService.sendEmbedMessage(message.channel, {
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
      });
    } catch (error) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Service is unavailable at the moment. Please try again later",
      });
    }
  }
}

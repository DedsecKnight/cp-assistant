import { Message, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import KattisUtilsService from "../../services/kattis.utils.service";

@singleton()
@injectable()
export default class RandomCommand implements ICommand<Message> {
  public commandName: string = "random";
  public commandDescription: string =
    "Generate a random problem within a provided range of difficulty";
  public commandParams: string[] = [
    "low_bound_difficulty",
    "high_bound_difficulty",
  ];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    const lowBound = parseFloat(args[2]);
    const highBound = parseFloat(args[3]);

    if (isNaN(lowBound) || isNaN(highBound) || lowBound > highBound) {
      return message.channel.send(
        "Invalid value for difficulty bound(s). Please try again."
      );
    }

    const problem = await this.kattisUtilsService.fetchRandomProblem(
      lowBound,
      highBound
    );

    if (!problem) {
      return message.channel.send(
        "No such problem found. Please adjust the difficulty range"
      );
    }

    const embed = new MessageEmbed();
    embed.setColor("ORANGE");

    embed.setTitle("Random Problem");
    embed.addField("Problem Name", problem.name, true);
    embed.addField(
      "Problem Difficulty",
      problem.difficulty.toFixed(1).toString(),
      true
    );
    embed.addField(
      "Problem URL",
      `${process.env.KATTIS_PROBLEM_URL!}/${problem.problemId}`
    );

    return message.channel.send({ embeds: [embed] });
  }
}

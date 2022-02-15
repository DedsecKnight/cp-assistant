import { Message, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import DatabaseService from "../../services/database.service";

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

  constructor(private databaseService: DatabaseService) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    const lowBound = parseInt(args[2]);
    const highBound = parseInt(args[3]);

    if (isNaN(lowBound) || isNaN(highBound) || lowBound > highBound) {
      return message.channel.send(
        "Invalid value for difficulty bound(s). Please try again."
      );
    }

    const problem = await this.databaseService.generateRandomProblem(
      lowBound,
      highBound
    );

    if (!problem) {
      return message.channel.send(
        "No such problem found. Please adjust the difficulty range"
      );
    }

    const embed = new MessageEmbed();

    embed.setTitle("Random Problem");
    embed.addField("Problem Name", problem.name, true);
    embed.addField(
      "Problem Difficulty",
      problem.difficulty.toFixed(1).toString(),
      true
    );
    embed.addField(
      "Problem URL",
      `https://open.kattis.com/problems/${problem.problemId}`
    );

    return message.channel.send({ embeds: [embed] });
  }
}

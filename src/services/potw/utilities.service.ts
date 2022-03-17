import { TextBasedChannel } from "discord.js";
import { scheduleJob } from "node-schedule";
import { injectable, singleton } from "tsyringe";
import { Embed } from "../../entity/utilities/embed.entity";
import KattisDatabaseService from "../kattis/database.service";
import MessageService from "../utilities/message.service";

@injectable()
@singleton()
export default class POTWUtilsService {
  private subscribedChannels: TextBasedChannel[];
  constructor(
    private kattisDatabaseService: KattisDatabaseService,
    private messageService: MessageService
  ) {
    this.subscribedChannels = [];

    scheduleJob(process.env.POTW_CRON_CONFIG_DEV!, async () => {
      const problem = await this.kattisDatabaseService.generateRandomProblem(
        0,
        6
      );
      const embed: Partial<Embed> = {
        color: "ORANGE",
        title: "Problem of the Week",
      };

      if (!problem) {
        embed.description = "POTW will not be available this week.";
      } else {
        embed.fields = [
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
      }

      return Promise.all(
        this.subscribedChannels.map((channel) =>
          this.messageService.sendEmbedMessage(channel, embed)
        )
      );
    });
  }

  public subscribeChannel(channel: TextBasedChannel) {
    this.subscribedChannels.push(channel);
  }

  public unsubscribeChannel(inputChannel: TextBasedChannel) {
    this.subscribedChannels = this.subscribedChannels.filter(
      (channel) => channel.id !== inputChannel.id
    );
  }
}

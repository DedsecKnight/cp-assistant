import type { TextBasedChannel } from "discord.js";
import { scheduleJob } from "node-schedule";
import { injectable, singleton } from "tsyringe";
import { Embed } from "../../entity/utilities/embed.entity";
import { POTWSubscriberChannel } from "../../entity/potw/subscriber.entity";
import KattisDatabaseService from "../kattis/database.service";
import KattisUtilsService from "../kattis/utilities.service";
import MessageService from "../utilities/message.service";
import POTWDatabaseService from "./database.service";

@injectable()
@singleton()
export default class POTWUtilsService {
  private subscribedChannels: POTWSubscriberChannel[];

  constructor(
    private kattisDatabaseService: KattisDatabaseService,
    private kattisUtilsService: KattisUtilsService,
    private messageService: MessageService,
    private potwDatabaseService: POTWDatabaseService
  ) {
    this.subscribedChannels = [];

    scheduleJob(process.env.POTW_CRON_CONFIG!, async () => {
      const problem = await this.kattisDatabaseService.generateRandomProblem(
        0,
        6
      );
      const embed: Partial<Embed> = {
        color: "ORANGE",
        title: "Problem of the Week from Kattis",
      };

      if (!problem) {
        embed.description = "POTW will not be available this week.";
        return Promise.all(
          this.subscribedChannels.map((subscriber) => {
            subscriber.destroyCollector();
            return this.messageService.sendEmbedMessage(
              subscriber.getChannel(),
              embed
            );
          })
        );
      }
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

      return Promise.all(
        this.subscribedChannels.map(async (subscriber) => {
          const collector = subscriber.getChannel().createMessageCollector({
            filter: (message) => {
              if (message.author.bot) return false;
              return (
                message.attachments.filter((value) =>
                  value.name!.toLowerCase().includes(problem!.problemId!)
                ).size > 0
              );
            },
          });
          collector.on("collect", async (message) => {
            const channelEntry = await this.potwDatabaseService.fetchChannel(
              message.channel.id
            );
            if (channelEntry!.mostRecentWinner === message.author.id) {
              await this.messageService.sendEmbedMessage(message.channel, {
                title: "Invalid submission",
                description:
                  "You are not eligible to participate in this week's POTW due to cooldown",
                color: "RED",
              });
              return;
            }
            await this.kattisUtilsService.processSubmitMesssage(
              process.env.KATTIS_SERVICE_USERNAME!,
              process.env.KATTIS_SERVICE_PASSWORD!,
              problem.problemId,
              message,
              async (currentStatus) => {
                if (currentStatus === "Accepted") {
                  subscriber.destroyCollector();
                  await this.potwDatabaseService.updateWinner(
                    channelEntry!.channelId,
                    message.author.id
                  );
                  await this.messageService.sendEmbedMessage(
                    subscriber.getChannel(),
                    {
                      description: `The winner of this week's POTW is ${message.author.toString()}`,
                      title: "POTW Announcement",
                    }
                  );
                }
              }
            );
          });

          subscriber.setCollector(collector, async () => {
            await this.messageService.sendEmbedMessage(
              subscriber.getChannel(),
              {
                title: "POTW Announcement",
                color: "YELLOW",
                description:
                  "There is no winner in this channel for last week's POTW. Following this announcement will be this week's POTW",
              }
            );
          });

          return this.messageService.sendEmbedMessage(
            subscriber.getChannel(),
            embed
          );
        })
      );
    });
  }

  public subscribeChannel(channel: TextBasedChannel) {
    this.subscribedChannels.push(new POTWSubscriberChannel(channel));
  }

  public unsubscribeChannel(inputChannel: TextBasedChannel) {
    this.subscribedChannels = this.subscribedChannels.filter(
      (subscriber) => subscriber.getChannel().id !== inputChannel.id
    );
  }
}

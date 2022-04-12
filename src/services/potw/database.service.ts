import { ReturnModelType } from "@typegoose/typegoose";
import { TextBasedChannel } from "discord.js";
import { singleton } from "tsyringe";
import {
  POTWSubscriberChannel,
  POTWSubscriberChannelModel,
} from "../../entity/potw/subscriber.entity";

@singleton()
export default class POTWDatabaseService {
  private potwSubscriberModel: ReturnModelType<typeof POTWSubscriberChannel>;

  constructor() {
    this.potwSubscriberModel = POTWSubscriberChannelModel;
  }

  public async addChannel(channel: TextBasedChannel) {
    const channelEntry = await this.potwSubscriberModel.findOne({
      channelId: channel.id,
    });
    if (!channelEntry) {
      await this.potwSubscriberModel.create({
        channelId: channel.id,
      });
    }
  }

  public fetchChannel(channelId: string) {
    return this.potwSubscriberModel.findOne({
      channelId,
    });
  }

  public removeChannel(channelId: string) {
    return this.potwSubscriberModel.deleteOne({
      channelId,
    });
  }

  public updateWinner(channelId: string, newWinnerId: string) {
    return this.potwSubscriberModel.updateOne(
      {
        channelId,
      },
      {
        $set: {
          mostRecentWinner: newWinnerId,
        },
      }
    );
  }

  public updatePOTWProposal(channelId: string, proposalUrl: string) {
    return this.potwSubscriberModel.updateOne(
      {
        channelId,
      },
      {
        $set: {
          potwProposal: proposalUrl,
        },
      }
    );
  }
}

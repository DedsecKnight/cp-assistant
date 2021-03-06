import { getModelForClass, prop } from "@typegoose/typegoose";
import type { MessageCollector, TextBasedChannel } from "discord.js";

export class POTWSubscriberChannel {
  private collector: MessageCollector | null;
  constructor(private channel: TextBasedChannel) {
    this.collector = null;
  }
  public getChannel(): TextBasedChannel {
    return this.channel;
  }
  public getCollector(): MessageCollector | null {
    return this.collector;
  }
  public async setCollector(
    newCollector: MessageCollector,
    onPreviousCollectorRunning?: (() => Promise<void>) | undefined
  ) {
    if (this.collector && !this.collector.ended) {
      this.collector.stop();
      if (onPreviousCollectorRunning) {
        await onPreviousCollectorRunning();
      }
    }

    this.collector = newCollector;
  }
  public destroyCollector() {
    if (!this.collector) return;
    this.collector.stop();
    this.collector = null;
  }

  @prop({ type: () => String, required: true })
  channelId: string;

  @prop({ type: () => String, default: "" })
  mostRecentWinner: string;

  @prop({ type: () => String, default: "" })
  potwProposal: string;
}

export const POTWSubscriberChannelModel = getModelForClass(
  POTWSubscriberChannel
);

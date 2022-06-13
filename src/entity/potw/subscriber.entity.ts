import { getModelForClass, prop } from "@typegoose/typegoose";
import type { MessageCollector, TextBasedChannel } from "discord.js";

/**
 *
 * A wrapper class for the POTW Service to interact with subscribed channels
 *
 * @param channelId ID of channel being wrapped
 * @param mostRecentWinner ID of channel's most recent POTW
 * @param potwProposal ID of Kattis problem that will be used for the next POTW specifically for that channel
 *
 */
export class POTWSubscriberChannel {
  private collector: MessageCollector | null;
  constructor(private channel: TextBasedChannel) {
    this.collector = null;
  }

  /**
   *
   * Get channel wrapped the class
   *
   * @returns a TextBasedChannel object that is wrapped around by the class
   *
   *
   */
  public getChannel(): TextBasedChannel {
    return this.channel;
  }

  /**
   *
   * Get the message collector that is currently associated with the channel.
   * A message collector is currently how the POTW service interact with the channel.
   *
   * @returns the collector that is currently used
   *
   */
  public getCollector(): MessageCollector | null {
    return this.collector;
  }

  /**
   *
   * Update the message collector
   *
   * @param newCollector the collector to be set to associate with the channel
   * @param onPreviousCollectorRunning a function that will be called when there is already a collector
   * associated with the channel
   *
   */
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

  /**
   *
   * Destroy the collector that is currently running
   *
   */
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

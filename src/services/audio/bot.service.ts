import { joinVoiceChannel } from "@discordjs/voice";
import { Message, Snowflake } from "discord.js";
import { injectable, singleton } from "tsyringe";
import CurrentSongCommand from "../../commands/audio/current.command";
import EnqueueCommand from "../../commands/audio/enqueue.command";
import QueueListCommand from "../../commands/audio/list.command";
import PauseCommand from "../../commands/audio/pause.command";
import PlayCommand from "../../commands/audio/play.command";
import SkipSongCommand from "../../commands/audio/skip.command";
import MusicSubscription from "../../entity/subscription.entity";
import { IService } from "../../interfaces/service.interface";

@injectable()
@singleton()
export default class AudioService extends IService<MusicSubscription> {
  public serviceName: string = "audio";
  public serviceDescription: string = "Audio Player Service";
  private subscriptionMap: Map<Snowflake, MusicSubscription>;

  constructor(
    playCommand: PlayCommand,
    enqueueCommand: EnqueueCommand,
    pauseCommand: PauseCommand,
    listCommand: QueueListCommand,
    currentCommand: CurrentSongCommand,
    skipCommand: SkipSongCommand
  ) {
    super(
      playCommand,
      enqueueCommand,
      pauseCommand,
      listCommand,
      currentCommand,
      skipCommand
    );
    this.subscriptionMap = new Map();
  }

  public async process(message: Message<boolean>, args: string[]) {
    if (args.length <= 1) {
      return this.printServiceInfo(message);
    }
    const commandName = args[1];
    if (!this.serviceContainer.hasOwnProperty(commandName)) {
      return message.reply("Command not found. Please try again");
    }
    const channel = message.member?.voice.channel;
    if (!channel) {
      return message.reply("You need to be in a channel to use this command");
    }

    let subscription = this.subscriptionMap.get(message.guildId!);
    if (!subscription) {
      this.subscriptionMap.set(
        channel.guild.id,
        new MusicSubscription(
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          })
        )
      );
      subscription = this.subscriptionMap.get(message.guildId!)!;
    }
    subscription.channel = message.channel;
    await this.serviceContainer[commandName].execute(subscription, args);
  }
}

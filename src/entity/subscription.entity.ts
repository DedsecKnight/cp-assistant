/**
 *
 * Implementation based on: https://github.com/discordjs/voice/blob/main/examples/music-bot/src/music/subscription.ts
 *
 */
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  stream,
  search,
  validate,
  video_basic_info,
  soundcloud,
} from "play-dl";
import { Track } from "./track.entity";
import { promisify } from "node:util";
import { MessageEmbed, TextBasedChannel } from "discord.js";

const wait = promisify(setTimeout);

export default class MusicSubscription {
  private readonly voiceConnection: VoiceConnection;
  private readonly audioPlayer: AudioPlayer;
  private queue: Track[];
  public channel: TextBasedChannel | undefined;

  private queueLock = false;
  private readyLock = false;

  constructor(voiceConnection: VoiceConnection) {
    this.channel = undefined;
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    this.queue = [];
    this.voiceConnection.on("stateChange", async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          try {
            await entersState(
              this.voiceConnection,
              VoiceConnectionStatus.Connecting,
              5_000
            );
          } catch {
            this.voiceConnection.destroy();
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
          this.voiceConnection.rejoin();
        } else {
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.stopSubscription();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        try {
          await entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Ready,
            20_000
          );
        } catch {
          if (
            this.voiceConnection.state.status !==
            VoiceConnectionStatus.Destroyed
          )
            this.voiceConnection.destroy();
        } finally {
          this.readyLock = false;
        }
      }
    });

    this.audioPlayer.on("stateChange", async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        this.queue.shift();
        await this.processQueue();
      }
    });

    voiceConnection.subscribe(this.audioPlayer);
  }

  private async processQueue() {
    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      this.queue.length === 0
    ) {
      return;
    }

    this.queueLock = true;
    const currTrack = this.queue[0];
    this.playTrack(currTrack);
    await this.channel!.send(`Playing **${currTrack.title}**`);
    this.queueLock = false;
  }

  private async playTrack(track: Track) {
    const playStream = await stream(track.url);
    this.audioPlayer.play(
      createAudioResource(playStream.stream, { inputType: playStream.type })
    );
  }

  public async processPlayCommand() {
    if (this.queue.length === 0) {
      return this.channel!.send("There is no music in the queue");
    }
    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await this.processQueue();
    } else if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.audioPlayer.unpause();
      await this.channel!.send("Playback resumed");
    }
  }

  public async processPauseCommand() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.audioPlayer.pause();
      await this.channel!.send("Playback paused");
    }
  }

  public async processSkipCommand() {
    if (this.queue.length === 0) {
      return this.channel!.send("There is no song in the queue currently");
    }
    const currentSongName = this.queue[0].title;
    this.audioPlayer.stop();
    return this.channel!.send(`Skipped **${currentSongName}**`);
  }

  public async processListQueueCommand() {
    const embed = new MessageEmbed();

    embed.setColor("#0099ff");

    embed.setTitle("CP Assistant Music Queue");
    embed.setDescription("Here is the current state of the music queue");

    if (this.queue.length === 0) {
      embed.addField(
        "No track in queue",
        "Please add track into queue by typing `!audio enqueue <youtube_url>`"
      );
    } else {
      this.queue.forEach((item, idx) => {
        embed.addField(`${idx + 1}. ${item.title}`, item.url);
      });
    }

    await this.channel!.send({ embeds: [embed] });
  }

  public async processCurrentSongCommand() {
    if (
      this.queue.length === 0 ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Playing
    ) {
      return this.channel!.send("There is no song playing at the moment");
    }
    await this.channel!.send(`Currently playing **${this.queue[0].title}**`);
  }

  private async generateTrack(mediaQuery: string): Promise<Track | null> {
    let mediaUrl = mediaQuery;
    let mediaTitle = "";
    const validateResult = await validate(mediaQuery);
    if (!validateResult || validateResult === "search") {
      // If mediaQuery is not a valid query, it will be processed as search query on YouTube
      const videos = await search(mediaQuery, {
        limit: 1,
        source: {
          youtube: "video",
        },
      });
      if (videos.length === 0) {
        await this.channel!.send("Cannot find any video. Please try again");
        return null;
      }
      mediaUrl = videos[0].url;
      mediaTitle = videos[0].title!;
    } else if (validateResult === "yt_video") {
      // If mediaQuery is a url to a YouTube Video
      mediaTitle = (await video_basic_info(mediaUrl)).video_details.title!;
    } else if (validateResult === "so_track") {
      // If mediaQuery is a url to a SoundCloud track
      mediaTitle = (await soundcloud(mediaUrl)).name;
    } else {
      console.log("Unknown media type found: ", validateResult);
      await this.channel!.send(
        "This bot is yet to support this type of media."
      );
      return null;
    }

    return {
      title: mediaTitle,
      url: mediaUrl,
    };
  }

  public async processEnqueueCommand(mediaQuery: string) {
    if (this.queueLock) {
      return this.channel!.send(
        "Queue is currently in use by another process. Please try again later"
      );
    }

    const newTrack = await this.generateTrack(mediaQuery);
    if (!newTrack) {
      return;
    }

    this.queueLock = true;
    this.queue.push(newTrack);
    this.queueLock = false;
    await this.channel!.send(`**${newTrack.title}** added to queue`);
  }

  private stopSubscription() {
    this.queueLock = true;
    this.queue = [];
    this.audioPlayer.stop(true);
  }
}

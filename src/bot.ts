import { Client, Intents } from "discord.js";
import { injectable, singleton } from "tsyringe";
import BotModule from "./modules/bot.module";
import play from "play-dl";
import DatabaseService from "./services/database.service";

@injectable()
@singleton()
export default class Bot {
  private client: Client;
  constructor(
    private botModule: BotModule,
    private databaseService: DatabaseService
  ) {
    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
      ],
      partials: ["CHANNEL"],
    });
  }

  public async registerSoundCloudClientID() {
    const clientID = await play.getFreeClientID();
    play.setToken({
      soundcloud: {
        client_id: clientID,
      },
    });
  }

  public async initialize(): Promise<string> {
    try {
      await this.databaseService.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error(error);
      process.exit(1);
    }

    this.client.once("ready", () => {
      console.log("Bot is ready");
    });

    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      message.content = message.content.replaceAll("||", " ").trim();
      if (!message.content.startsWith("!")) return;
      await this.botModule.run(message);
    });

    await this.registerSoundCloudClientID();

    return this.client.login(process.env.DISCORD_BOT);
  }
}

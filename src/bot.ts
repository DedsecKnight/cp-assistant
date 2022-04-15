import { Client, Intents } from "discord.js";
import { injectable, singleton } from "tsyringe";
import TextCommandModule from "./modules/text.module";
import play from "play-dl";
import mongoose from "mongoose";
import SlashCommandModule from "./modules/slash.module";

@injectable()
@singleton()
export default class Bot {
  private client: Client;
  constructor(
    private textCommandModule: TextCommandModule,
    private slashModule: SlashCommandModule
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

  private async registerSoundCloudClientID() {
    const clientID = await play.getFreeClientID();
    play.setToken({
      soundcloud: {
        client_id: clientID,
      },
    });
  }

  private async connectToDatabase() {
    return mongoose.connect(process.env.MONGODB_URI!, {
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
  }

  public async initialize(): Promise<any> {
    try {
      await this.connectToDatabase();
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
      await this.textCommandModule.run(message);
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;
      await this.slashModule.processSlashCommand(interaction);
    });

    await this.registerSoundCloudClientID();
    await this.client.login(process.env.DISCORD_BOT);

    try {
      await this.slashModule.initializeSlashCommands(this.client.user!.id);
      console.log("Slash commands initialized");
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

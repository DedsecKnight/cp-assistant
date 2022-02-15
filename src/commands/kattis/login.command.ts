import axios from "axios";
import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import { URLSearchParams } from "url";
import DatabaseService from "../../services/database.service";

@singleton()
@injectable()
export default class LoginCommand implements ICommand<Message> {
  public commandName: string = "login";
  public commandDescription: string =
    "Use this command to login into Kattis. Please use this command through DM.";
  public commandParams: string[] = ["username", "password"];

  constructor(private databaseService: DatabaseService) {}

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (message.channel.type !== "DM") {
      return message.channel.send("Please use this command in DM");
    }
    if (args.length < 4) {
      return message.author.send("Username and password is required to login");
    }
    const user = args[2];
    const password = args[3];

    const params = new URLSearchParams({ user, password, script: "true" });

    try {
      const res = await axios.post(
        process.env.KATTIS_LOGIN_URL!,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      await this.databaseService.updateUserKattisCookie(
        message.author.id,
        res.headers["set-cookie"]![0].split("; ")[0]
      );

      return message.author.send("Login succesfully!");
    } catch (error) {
      console.error(error);
      return message.author.send("Login failed");
    }
  }
}

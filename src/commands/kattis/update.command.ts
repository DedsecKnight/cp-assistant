import axios from "axios";
import { Message } from "discord.js";
import parse from "node-html-parser";
import { injectable, singleton } from "tsyringe";
import { URLSearchParams } from "url";
import { ICommand } from "../../interfaces/command.interface";
import fs from "fs";
import DatabaseService from "../../services/database.service";
import KattisProblem from "../../entity/problem.kattis.entity";

@injectable()
@singleton()
export default class UpdateCommand implements ICommand<Message> {
  public commandName: string = "update";
  public commandDescription: string =
    "Use this command to update the problem database";
  public commandParams: string[] = [];

  constructor(private databaseService: DatabaseService) {}

  private async getCookie() {
    const params = new URLSearchParams({
      user: process.env.KATTIS_SERVICE_USERNAME!,
      password: process.env.KATTIS_SERVICE_PASSWORD!,
      script: "true",
    });
    const res = await axios.post(
      process.env.KATTIS_LOGIN_URL!,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.headers["set-cookie"]![0].split("; ")[0];
  }

  private async getProblemList(): Promise<KattisProblem[]> {
    const cookie = await this.getCookie();

    const { data: htmlData } = await axios.get(process.env.KATTIS_SUBMIT_URL!, {
      headers: {
        Cookie: cookie,
      },
    });

    const parsedJs = parse(htmlData)
      .querySelectorAll("script")
      .filter((obj) => obj.parentNode.rawAttrs === 'class="wrap"')[0].innerHTML;

    const startIndex = parsedJs.indexOf('available: [{"problem_id"') + 11;
    const endIndex = parsedJs.indexOf('placeholder: "Select a problem"') - 14;

    const problems: any[] = JSON.parse(
      parsedJs.substring(startIndex, endIndex)
    );
    return problems.map((problem: any) => ({
      problemId: problem.problem_name,
      name: problem.fulltitle,
      difficulty: parseFloat(problem.problem_difficulty),
    }));
  }

  public async execute(message: Message, args: string[]): Promise<any> {
    const problems = await this.getProblemList();

    await this.databaseService.updateKattisProblemDatabase(problems);

    return message.channel.send("Problem database updated");
  }
}

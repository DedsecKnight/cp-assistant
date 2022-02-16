import axios from "axios";
import { Message, MessageEmbed } from "discord.js";
import parse from "node-html-parser";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import DatabaseService from "../../services/database.service";
import KattisProblem from "../../entity/problem.kattis.entity";
import KattisUtilsService from "../../services/kattis.utils.service";

@injectable()
@singleton()
export default class UpdateCommand implements ICommand<Message> {
  public commandName: string = "update";
  public commandDescription: string =
    "Use this command to update the problem database";
  public commandParams: string[] = [];

  constructor(private kattisUtilsService: KattisUtilsService) {}

  public async execute(message: Message, args: string[]): Promise<any> {
    const embed = new MessageEmbed();
    embed.setTitle("Updating problem database...");
    embed.setColor("YELLOW");

    const replyMessage = await message.channel.send({ embeds: [embed] });

    await this.kattisUtilsService.updateKattisProblemDatabase();

    embed.setTitle("Problem database updated!");
    embed.setColor("GREEN");

    return replyMessage.edit({ embeds: [embed] });
  }
}

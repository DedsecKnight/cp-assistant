import { Message, MessageEmbed } from "discord.js";
import { singleton, injectable } from "tsyringe";
import { IService } from "../interfaces/service.interface";
import AudioService from "../services/audio.service";
import KattisService from "../services/kattis.service";
import TemplateService from "../services/template.service";

@singleton()
@injectable()
export default class BotModule {
  private serviceMapping: Record<string, IService>;
  constructor(
    audioService: AudioService,
    templateService: TemplateService,
    kattisService: KattisService
  ) {
    this.serviceMapping = Array.from(arguments).reduce(
      (acc: typeof this.serviceMapping, service: IService) => ({
        ...acc,
        [service.serviceName]: service,
      }),
      {} as typeof this.serviceMapping
    );
  }

  public printServiceInfo(message: Message) {
    const embed = new MessageEmbed();
    embed.setColor("DEFAULT");
    embed.setTitle("CP Assistant's service");

    Object.entries(this.serviceMapping).forEach(([serviceName, service]) => {
      embed.addField(
        `\`!${serviceName} <command>\``,
        service.serviceDescription
      );
    });

    return message.channel.send({ embeds: [embed] });
  }

  public async run(message: Message) {
    const args = message.content.split(" ").filter((val) => val !== "");
    const serviceName = args[0].substring(1);
    if (serviceName === "") {
      return this.printServiceInfo(message);
    }
    if (!this.serviceMapping.hasOwnProperty(serviceName)) {
      return message.reply("Service not found! Please try again");
    }
    await this.serviceMapping[serviceName].process(message, args);
  }
}

import { MessageEmbed, TextBasedChannel } from "discord.js";
import { singleton } from "tsyringe";
import { Embed } from "../entity/embed.entity";

@singleton()
export default class MessageService {
  public async sendEmbedMessage(
    channel: TextBasedChannel,
    embedData: Partial<Embed>
  ) {
    const embed = new MessageEmbed();
    if (embedData.title) {
      embed.setTitle(embedData.title);
    }
    if (embedData.description) {
      embed.setDescription(embedData.description);
    }
    if (embedData.color) {
      embed.setColor(embedData.color);
    }
    if (embedData.fields) {
      embedData.fields.forEach(({ name, value, inline }) => {
        embed.addField(name, value, inline || false);
      });
    }

    return channel.send({ embeds: [embed] });
  }
}

import { Message, MessageEmbed, TextBasedChannel } from "discord.js";
import { singleton } from "tsyringe";
import { Embed } from "../../entity/embed.entity";

@singleton()
export default class MessageService {
  private generateEmbed(embedData: Partial<Embed>) {
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
    return embed;
  }

  public async sendEmbedMessage(
    channel: TextBasedChannel,
    embedData: Partial<Embed>
  ) {
    return channel.send({ embeds: [this.generateEmbed(embedData)] });
  }

  public async editEmbedMessage(message: Message, embedData: Partial<Embed>) {
    return message.edit({ embeds: [this.generateEmbed(embedData)] });
  }
}

import {
  Message,
  MessageEmbed,
  MessageEmbedOptions,
  TextBasedChannel,
} from "discord.js";
import { singleton } from "tsyringe";

@singleton()
export default class MessageService {
  private generateEmbed(embedData: MessageEmbedOptions) {
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
    embedData: MessageEmbedOptions
  ) {
    return channel.send({ embeds: [this.generateEmbed(embedData)] });
  }

  public async editEmbedMessage(
    message: Message,
    embedData: MessageEmbedOptions
  ) {
    return message.edit({ embeds: [this.generateEmbed(embedData)] });
  }
}

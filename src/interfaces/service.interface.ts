import { ColorResolvable, Message, MessageEmbed } from "discord.js";
import { ICommand } from "./command.interface";

export abstract class IService<T = any> {
  public abstract serviceName: string;
  public abstract serviceDescription: string;

  protected serviceContainer: Record<string, ICommand<T>>;

  constructor(...commands: ICommand<T>[]) {
    this.serviceContainer = Array.from(commands).reduce(
      (acc: Record<string, ICommand<T>>, command: ICommand<T>) => ({
        ...acc,
        [command.commandName]: command,
      }),
      {} as Record<string, ICommand<T>>
    );
  }
  public abstract process(message: Message, args: string[]): Promise<any>;
  public async printServiceInfo(
    message: Message<boolean>,
    color?: ColorResolvable
  ): Promise<any> {
    const embed = new MessageEmbed();
    if (color) {
      embed.setColor(color);
    }

    embed.setTitle(`CP Assistant's ${this.serviceDescription}`);

    Object.entries(this.serviceContainer).forEach(([commandName, command]) => {
      embed.addField(
        `\`!${this.serviceName} ${commandName} ${command.commandParams
          .map((c) => `<${c}>`)
          .join(" ")}\``,
        command.commandDescription
      );
    });

    return message.channel.send({ embeds: [embed] });
  }
}

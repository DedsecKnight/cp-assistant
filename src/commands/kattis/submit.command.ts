import { CommandInteraction, CacheType } from "discord.js";
import { injectable, singleton } from "tsyringe";
import {
  ISlashCommand,
  SlashCommandParam,
} from "../../interfaces/slash.command.interface";
import KattisUtilsService from "../../services/kattis/utilities.service";
import MessageService from "../../services/utilities/message.service";

@injectable()
@singleton()
export default class SubmitCommand implements ISlashCommand {
  public commandName: string = "submit";
  public commandDescription: string = "Submit your code to Kattis.";
  public commandParams: SlashCommandParam[] = [
    {
      paramName: "problem_id",
      paramDescription: "Problem ID",
      paramRequired: true,
    },
    {
      paramName: "secret_key",
      paramDescription: "Secret key generated when login",
      paramRequired: true,
    },
  ];

  constructor(
    private kattisUtilsService: KattisUtilsService,
    private messageService: MessageService
  ) {}

  public async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<any> {
    await interaction.reply({
      content:
        "Please upload 1 file as your submission source code here within 20 seconds",
      fetchReply: true,
    });

    interaction.channel
      ?.awaitMessages({
        filter: (response) => {
          return (
            response.attachments.size === 1 &&
            response.author.id === interaction.member!.user.id
          );
        },
        max: 1,
        time: 20000,
        errors: ["time"],
      })
      .then(async (collected) => {
        const problemId = interaction.options.getString("problem_id")!;
        const userSecretKey = interaction.options.getString("secret_key")!;
        const userData = await this.kattisUtilsService.getKattisUser(
          collected.first()!.author.id
        );

        if (!userData) {
          return this.messageService.sendEmbedMessage(
            collected.first()!.channel,
            {
              color: "RED",
              description:
                "Your credentials cannot be found. Please login again using `!kattis login` command",
            }
          );
        }

        const { decryptedPassword, statusCode: decryptPasswordStatusCode } =
          this.kattisUtilsService.decryptKattisPassword(
            userData.kattisPassword,
            userSecretKey
          );

        if (decryptPasswordStatusCode !== 200) {
          return this.messageService.sendEmbedMessage(
            collected.first()!.channel,
            {
              color: "RED",
              description:
                "Invalid secret key. Please make sure that the correct secret key is used",
            }
          );
        }

        this.kattisUtilsService.processSubmitMesssage(
          userData.kattisUsername,
          decryptedPassword,
          problemId,
          collected.first()!
        );
      })
      .catch((_) => {
        interaction.followUp("No submissions received. Please try again");
      });
  }
}

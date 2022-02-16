import { Message, MessageEmbed } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import FileService from "../../services/file.service";
import KattisUtilsService from "../../services/kattis.utils.service";
import KattisUser from "../../entity/user.kattis.entity";

@singleton()
@injectable()
export default class SubmitCommand implements ICommand<Message> {
  public commandName: string = "submit";
  public commandDescription: string =
    "Submit your code to Kattis. Please login before using this command. Attach solution file along with command message.";
  public commandParams: string[] = ["problem_id", "secret_key"];

  constructor(
    private kattisUtilsService: KattisUtilsService,
    private fileService: FileService
  ) {}

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }

  private async trackSubmissionStatus(
    userMsg: Message,
    userData: KattisUser,
    userSecretKey: string,
    submissionId: string
  ) {
    const embed = new MessageEmbed();
    embed.setTitle("Fetching Submission Data...");

    const message = await userMsg.author.send({ embeds: [embed] });
    const decryptedPassword = this.kattisUtilsService.decryptKattisPassword(
      userData.kattisPassword,
      userSecretKey
    );

    const cookieData = await this.kattisUtilsService.generateKattisCookie(
      userData.kattisUsername,
      decryptedPassword
    );
    while (true) {
      const {
        statusId,
        verdicts,
        statusCode: responseStatusCode,
      } = await this.kattisUtilsService.getSubmissionData(
        cookieData.cookie!,
        submissionId
      );

      if (responseStatusCode !== 200) {
        embed.setTitle("Error getting data from Kattis.");
        await message.edit({ embeds: [embed] });
        break;
      }

      embed.setTitle(this.kattisUtilsService.getSubmissionStatusById(statusId));
      embed.setDescription(verdicts.join(" "));
      await message.edit({ embeds: [embed] });

      if (this.kattisUtilsService.judgeFinished(statusId)) {
        break;
      }
      await this.wait(250);
    }
  }

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (message.channel.type !== "DM") {
      return message.author.send(
        "This command can only be used in DM. If you accidentally exposed your credentials on a public server, please update your credentials and login again"
      );
    }

    if (args.length < 3) {
      return message.author.send("Problem ID is required");
    }

    if (args.length < 4) {
      return message.author.send(
        "Secret key is required to use this functionality"
      );
    }

    const submissionFiles = message.attachments;
    if (submissionFiles.size < 1) {
      return message.author.send(
        "At least 1 submission file is required. Please try again"
      );
    }

    if (submissionFiles.size > 1) {
      return message.author.send("Only 1 file is allowed. Please try again.");
    }

    const problemId = args[2].toLowerCase();
    const userSecretKey = args[3];
    const userData = await this.kattisUtilsService.getKattisUser(
      message.author.id
    );

    if (!userData) {
      return message.author.send(
        "Your credentials cannot be found. Please login again using `!kattis login` command"
      );
    }

    const decryptedPassword = this.kattisUtilsService.decryptKattisPassword(
      userData.kattisPassword,
      userSecretKey
    );
    const cookieData = await this.kattisUtilsService.generateKattisCookie(
      userData.kattisUsername,
      decryptedPassword
    );

    if (cookieData.statusCode !== 200) {
      return message.author.send(
        "Failed to authenticate with Kattis. Please make sure that your credentials is correct and try again later"
      );
    }

    const submissionFile = submissionFiles.first()!;
    const fileName = submissionFile.name!;

    const fileData = await this.fileService.extractDiscordAttachmentContent(
      submissionFile
    );
    const filepath = await this.fileService.createFile(
      message.guildId || "",
      message.author.id,
      fileName,
      fileData
    );

    const { statusCode, submissionId } =
      await this.kattisUtilsService.submitSolution(
        problemId,
        filepath,
        cookieData.cookie
      );
    if (statusCode >= 400) {
      return message.author.send(
        "Submission command is not working at the moment. Please try again later"
      );
    }

    this.trackSubmissionStatus(message, userData, userSecretKey, submissionId);
  }
}

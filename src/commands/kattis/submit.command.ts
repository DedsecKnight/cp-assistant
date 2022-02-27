import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import FileService from "../../services/utilities/file.service";
import KattisUtilsService from "../../services/kattis/utilities.service";
import KattisUser from "../../entity/user.kattis.entity";
import MessageService from "../../services/utilities/message.service";
import { Embed } from "../../entity/embed.entity";

@singleton()
@injectable()
export default class SubmitCommand implements ICommand<Message> {
  public commandName: string = "submit";
  public commandDescription: string =
    "Submit your code to Kattis. Include solution file and secret key along with command message. Command will only works on DM.";
  public commandParams: string[] = ["problem_id", "secret_key"];

  constructor(
    private kattisUtilsService: KattisUtilsService,
    private fileService: FileService,
    private messageService: MessageService
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
    const embedConfig: Partial<Embed> = {
      color: "YELLOW",
      title: "Fetching Submission Data...",
    };

    const message = await this.messageService.sendEmbedMessage(
      userMsg.channel,
      embedConfig
    );

    const { decryptedPassword } = this.kattisUtilsService.decryptKattisPassword(
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
        embedConfig.title = "Error getting data from Kattis.";
        embedConfig.color = "RED";
        await this.messageService.editEmbedMessage(message, embedConfig);
        break;
      }

      const currentStatus =
        this.kattisUtilsService.getSubmissionStatusById(statusId);
      const judgeFinished = this.kattisUtilsService.judgeFinished(statusId);

      embedConfig.title = currentStatus;
      embedConfig.description = verdicts.join(" ");

      if (currentStatus === "Accepted") {
        embedConfig.color = "GREEN";
      } else if (judgeFinished) {
        embedConfig.color = "RED";
      }

      await this.messageService.editEmbedMessage(message, embedConfig);

      if (judgeFinished) {
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
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "YELLOW",
        description:
          "This command can only be used in DM. If you accidentally exposed your credentials on a public server, please update your credentials and login again",
      });
    }

    if (args.length < 3) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Problem ID is required",
      });
    }

    if (args.length < 4) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Secret key is required to use this functionality",
      });
    }

    const submissionFiles = message.attachments;
    if (submissionFiles.size < 1) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "At least 1 submission file is required. Please try again",
      });
    }

    if (submissionFiles.size > 1) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description: "Only 1 file is allowed. Please try again.",
      });
    }

    const problemId = args[2].toLowerCase();
    const userSecretKey = args[3];
    const userData = await this.kattisUtilsService.getKattisUser(
      message.author.id
    );

    if (!userData) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Your credentials cannot be found. Please login again using `!kattis login` command",
      });
    }

    const { decryptedPassword, statusCode: decryptPasswordStatusCode } =
      this.kattisUtilsService.decryptKattisPassword(
        userData.kattisPassword,
        userSecretKey
      );

    if (decryptPasswordStatusCode !== 200) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Invalid secret key. Please make sure that the correct secret key is used",
      });
    }

    const cookieData = await this.kattisUtilsService.generateKattisCookie(
      userData.kattisUsername,
      decryptedPassword
    );

    if (cookieData.statusCode !== 200) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Failed to authenticate with Kattis. Please make sure that your credentials is correct and try again later",
      });
    }

    const submissionFile = submissionFiles.first()!;
    const fileName = submissionFile.name!;

    const fileExtension = this.fileService.getFileExtension(fileName);
    if (!this.kattisUtilsService.isSupportedExtension(fileExtension)) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "RED",
        description:
          "Extension is not supported. Please try again with either C++, Java, or Python 3 submission",
      });
    }

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
        cookieData.cookie,
        fileExtension
      );
    if (statusCode >= 400) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "YELLOW",
        description:
          "Submission command is not working at the moment. Please try again later",
      });
    }

    this.trackSubmissionStatus(message, userData, userSecretKey, submissionId);
  }
}

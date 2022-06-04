import axios from "axios";
import crypto from "crypto";
import { singleton, injectable } from "tsyringe";
import { URLSearchParams } from "url";
import { parse } from "node-html-parser";
import { RUNNING_STATUS, STATUS_MAP } from "../../constants/kattis.constant";
import fs from "fs";
import FormData from "@discordjs/form-data";
import KattisProblem from "../../entity/kattis/problem.entity";
import KattisDatabaseService from "./database.service";
import { Message, MessageEmbedOptions, TextBasedChannel } from "discord.js";
import MessageService from "../utilities/message.service";
import FileService from "../utilities/file.service";

@singleton()
@injectable()
export default class KattisUtilsService {
  constructor(
    private databaseService: KattisDatabaseService,
    private messageService: MessageService,
    private fileService: FileService
  ) {}
  private languageMapping: Record<string, string> = {
    ".cpp": "C++",
    ".java": "Java",
    ".py": "Python 3",
  };

  private encryptPassword(password: string) {
    const secretKey = crypto.randomBytes(32);
    const iv = Buffer.from(process.env.KATTIS_IV!, "hex");

    const encryptCipher = crypto.createCipheriv("aes256", secretKey, iv);
    const encryptedPassword =
      encryptCipher.update(password, "utf8", "hex") +
      encryptCipher.final("hex");

    return {
      encryptedPassword,
      secretKey: secretKey.toString("hex"),
    };
  }

  public isSupportedExtension(extension: string) {
    return this.languageMapping.hasOwnProperty(extension);
  }

  public async updateUserCredentials(
    userId: string,
    user: string,
    password: string
  ): Promise<string> {
    const { encryptedPassword, secretKey } = this.encryptPassword(password);

    await this.databaseService.updateUserCredentials(
      userId,
      user,
      encryptedPassword
    );

    return secretKey;
  }

  public async processSubmitMesssage(
    kattisUsername: string,
    kattisPassword: string,
    problemId: string,
    message: Message,
    onJudgeFinished?: ((currentStatus: string) => Promise<void>) | undefined
  ) {
    const cookieData = await this.generateKattisCookie(
      kattisUsername,
      kattisPassword
    );
    const submissionFile = message.attachments.first()!;
    const fileName = submissionFile.name!;

    const fileExtension = this.fileService.getFileExtension(fileName);
    if (!this.isSupportedExtension(fileExtension)) {
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

    const { statusCode: submitSolutionStatusCode, submissionId } =
      await this.submitSolution(
        problemId,
        filepath,
        cookieData.cookie,
        fileExtension
      );

    if (submitSolutionStatusCode >= 400) {
      return this.messageService.sendEmbedMessage(message.channel, {
        color: "YELLOW",
        description:
          "Submission command is not working at the moment. Please try again later",
      });
    }

    this.trackSubmissionStatus(
      message.channel,
      kattisUsername,
      kattisPassword,
      submissionId,
      onJudgeFinished
    );
  }

  public async getSubmissionData(
    cookieData: string,
    submissionId: string
  ): Promise<WithResponseStatusCode<{ statusId: number; verdicts: string[] }>> {
    const submissionUrl = `${process.env
      .KATTIS_SUBMISSIONS_URL!}/${submissionId}?json`;
    try {
      const { data: htmlData } = await axios.get(submissionUrl, {
        headers: {
          Cookie: cookieData,
        },
      });
      const parsedData = parse(htmlData.row_html);
      const testCaseData = parsedData
        .querySelector("div.testcases")!
        .querySelectorAll("span");

      return {
        statusCode: 200,
        statusId: htmlData.status_id,
        verdicts: testCaseData.map((obj) => {
          const temp = obj.getAttribute("class");
          if (!temp) return "⬛";
          if (temp === "rejected") return "❌";
          return "✅";
        }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 400,
        statusId: -1,
        verdicts: [],
      };
    }
  }

  private getSubmissionId(response: string) {
    const submissionId = response.substring(36);
    return submissionId.substring(0, submissionId.length - 1);
  }

  public async submitSolution(
    problemId: string,
    submissionFilePath: string,
    userCookie: string,
    extension: string
  ): Promise<WithResponseStatusCode<{ submissionId: string }>> {
    const formData = new FormData();

    formData.append("submit", "true");
    formData.append("submit_ctr", 2);
    formData.append("language", this.languageMapping[extension]);
    formData.append("problem", problemId);
    formData.append("script", "true");

    formData.append("sub_file[]", fs.createReadStream(submissionFilePath), {
      contentType: "application/octet-stream",
    });

    try {
      const res = await axios.post(process.env.KATTIS_SUBMIT_URL!, formData, {
        headers: {
          Cookie: userCookie,
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
        },
      });

      return {
        statusCode: 200,
        submissionId: this.getSubmissionId(res.data),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        submissionId: "",
      };
    }
  }

  public getSubmissionStatusById(statusId: number) {
    return STATUS_MAP[statusId];
  }

  public judgeFinished(currentStatusId: number) {
    return currentStatusId > RUNNING_STATUS;
  }

  public async getKattisUser(userDiscordId: string) {
    return this.databaseService.getUserCredentials(userDiscordId);
  }

  public decryptKattisPassword(
    encryptedPassword: string,
    userKey: string
  ): WithResponseStatusCode<{ decryptedPassword: string }> {
    const iv = Buffer.from(process.env.KATTIS_IV!, "hex");
    const decryptCipher = crypto.createDecipheriv(
      "aes256",
      Buffer.from(userKey, "hex"),
      iv
    );
    try {
      const decryptedPassword =
        decryptCipher.update(encryptedPassword, "hex", "utf8") +
        decryptCipher.final("utf8");

      return {
        statusCode: 200,
        decryptedPassword,
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 400,
        decryptedPassword: "",
      };
    }
  }

  public async generateKattisCookie(
    username: string,
    decryptedPassword: string
  ): Promise<WithResponseStatusCode<{ cookie: string }>> {
    const params = new URLSearchParams({
      user: username,
      password: decryptedPassword,
      script: "true",
    });

    try {
      const res = await axios.post(
        process.env.KATTIS_LOGIN_URL!,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return {
        statusCode: res.status,
        cookie: res.headers["set-cookie"]![0].split("; ")[0],
      };
    } catch (error: any) {
      console.error(error);
      return {
        statusCode: error.response.status,
        cookie: "",
      };
    }
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve, _) => {
      setTimeout(() => {
        resolve();
      }, milliseconds);
    });
  }

  public async trackSubmissionStatus(
    channel: TextBasedChannel,
    kattisUsername: string,
    kattisPassword: string,
    submissionId: string,
    onJudgeFinished?: ((currentStatus: string) => Promise<void>) | undefined
  ) {
    const embedConfig: MessageEmbedOptions = {
      color: "YELLOW",
      title: "Fetching Submission Data...",
    };

    const submissionStatusMessage = await this.messageService.sendEmbedMessage(
      channel,
      embedConfig
    );

    const cookieData = await this.generateKattisCookie(
      kattisUsername,
      kattisPassword
    );
    while (true) {
      const {
        statusId,
        verdicts,
        statusCode: responseStatusCode,
      } = await this.getSubmissionData(cookieData.cookie!, submissionId);

      if (responseStatusCode !== 200) {
        embedConfig.title = "Error getting data from Kattis.";
        embedConfig.color = "RED";
        await this.messageService.editEmbedMessage(
          submissionStatusMessage,
          embedConfig
        );
        break;
      }

      const currentStatus = this.getSubmissionStatusById(statusId);
      const judgeFinished = this.judgeFinished(statusId);

      embedConfig.title = currentStatus;
      embedConfig.description = verdicts.join(" ");

      if (currentStatus === "Accepted") {
        embedConfig.color = "GREEN";
      } else if (judgeFinished) {
        embedConfig.color = "RED";
      }

      await this.messageService.editEmbedMessage(
        submissionStatusMessage,
        embedConfig
      );

      if (judgeFinished) {
        if (onJudgeFinished) await onJudgeFinished(currentStatus);
        break;
      }

      await this.wait(250);
    }
  }

  private async getProblemList(): Promise<KattisProblem[]> {
    const { cookie, statusCode } = await this.generateKattisCookie(
      process.env.KATTIS_SERVICE_USERNAME!,
      process.env.KATTIS_SERVICE_PASSWORD!
    );

    if (statusCode !== 200) {
      return [];
    }

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

  public async updateKattisProblemDatabase() {
    const problems = await this.getProblemList();

    await this.databaseService.updateProblemDatabase(problems);
  }

  public async fetchRandomProblem(lowBound: number, highBound: number) {
    return this.databaseService.generateRandomProblem(lowBound, highBound);
  }
}

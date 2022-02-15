import axios from "axios";
import crypto from "crypto";
import { singleton, injectable } from "tsyringe";
import DatabaseService from "./database.service";
import { URLSearchParams } from "url";
import { parse } from "node-html-parser";
import { RUNNING_STATUS, STATUS_MAP } from "../constants/kattis.constant";
import fs from "fs";
import FormData from "@discordjs/form-data";

@singleton()
@injectable()
export default class KattisUtilsService {
  constructor(private databaseService: DatabaseService) {}

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

  public async updateUserCredentials(
    userId: string,
    user: string,
    password: string
  ): Promise<string> {
    const { encryptedPassword, secretKey } = this.encryptPassword(password);

    await this.databaseService.updateUserKattis(
      userId,
      user,
      encryptedPassword
    );

    return secretKey;
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
    userCookie: string
  ): Promise<WithResponseStatusCode<{ submissionId: string }>> {
    const formData = new FormData();

    formData.append("submit", "true");
    formData.append("submit_ctr", 2);
    formData.append("language", "C++");
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
    return this.databaseService.getUserKattis(userDiscordId);
  }

  private decryptPassword(encryptedPassword: string, userKey: string) {
    const iv = Buffer.from(process.env.KATTIS_IV!, "hex");
    const decryptCipher = crypto.createDecipheriv(
      "aes256",
      Buffer.from(userKey, "hex"),
      iv
    );
    const decryptedPassword =
      decryptCipher.update(encryptedPassword, "hex", "utf8") +
      decryptCipher.final("utf8");

    return decryptedPassword;
  }

  public async generateKattisCookie(
    username: string,
    encryptedPassword: string,
    userKey: string
  ): Promise<WithResponseStatusCode<{ cookie: string }>> {
    const decryptedPassword = this.decryptPassword(encryptedPassword, userKey);

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
}

import axios from "axios";
import { Message } from "discord.js";
import { injectable, singleton } from "tsyringe";
import { ICommand } from "../../interfaces/command.interface";
import DatabaseService from "../../services/database.service";
import FormData from "@discordjs/form-data";
import fs from "fs";
import FileService from "../../services/file.service";

@singleton()
@injectable()
export default class SubmitCommand implements ICommand<Message> {
  public commandName: string = "submit";
  public commandDescription: string =
    "Submit your code to Kattis. Please login before using this command. Attach solution file along with command message.";
  public commandParams: string[] = ["problem_id"];

  constructor(
    private databaseService: DatabaseService,
    private fileService: FileService
  ) {}

  private getSubmissionId(response: string) {
    const submissionId = response.substring(36);
    return submissionId.substring(0, submissionId.length - 1);
  }

  public async execute(
    message: Message<boolean>,
    args: string[]
  ): Promise<any> {
    if (args.length < 3) {
      return message.author.send("Problem ID is required");
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
    const cookieData = await this.databaseService.getUserKattisCookie(
      message.author.id
    );

    if (!cookieData) {
      return message.author.send(
        "Please login through DM using `!kattis login` to use this feature."
      );
    }

    const formData = new FormData();

    formData.append("submit", "true");
    formData.append("submit_ctr", 2);
    formData.append("language", "C++");
    formData.append("problem", problemId);
    formData.append("script", "true");

    const submissionFile = submissionFiles.first()!;
    const fileName = submissionFile.name!;

    const { data: fileData } = await axios.get<string>(submissionFile!.url);
    const filepath = await this.fileService.createFile(
      message.guildId || "",
      message.author.id,
      fileName,
      fileData
    );

    formData.append("sub_file[]", fs.createReadStream(filepath), {
      contentType: "application/octet-stream",
    });

    try {
      const res = await axios.post(process.env.KATTIS_SUBMIT_URL!, formData, {
        headers: {
          Cookie: cookieData.cookie,
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
        },
      });

      return message.author.send(
        `Submission sucessful! View your submission here: ${process.env
          .KATTIS_SUBMISSIONS_URL!}/${this.getSubmissionId(res.data)}`
      );
    } catch (error: any) {
      fs.writeFileSync("file/error.txt", error.response.data);
      return message.author.send(
        "Submission command is not working at the moment. Please try again later"
      );
    }
  }
}

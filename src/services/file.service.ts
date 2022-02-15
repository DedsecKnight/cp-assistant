import { singleton } from "tsyringe";
import fs from "fs";

@singleton()
export default class FileService {
  public createFile(
    guildId: string,
    userId: string,
    fileName: string,
    content: string
  ) {
    return new Promise<string>((resolve, reject) => {
      if (!fs.existsSync(`file/${guildId}_${userId}`))
        fs.mkdirSync(`file/${guildId}_${userId}`);
      if (fs.existsSync(`file/${guildId}_${userId}/${fileName}`)) {
        resolve(`file/${guildId}_${userId}/${fileName}`);
      }
      fs.writeFile(`file/${guildId}_${userId}/${fileName}`, content, (err) => {
        if (err) reject(err);
        else resolve(`file/${guildId}_${userId}/${fileName}`);
      });
    });
  }
}

import "reflect-metadata";
import * as dotenv from "dotenv";
import { container } from "tsyringe";
import BotService from "./bot";
dotenv.config();

const bot = container.resolve(BotService);

bot
  .initialize()
  .then(() => {
    console.info("Login successful");
  })
  .catch((err) => {
    console.info("Error logging in");
    console.error(err);
  });

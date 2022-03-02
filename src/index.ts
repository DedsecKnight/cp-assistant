import "reflect-metadata";
import * as dotenv from "dotenv";
import { container } from "tsyringe";
import BotService from "./bot";
import { RequestInfo, RequestInit } from "node-fetch";

dotenv.config();
(global as any).fetch = (url: RequestInfo, init?: RequestInit) =>
  import("node-fetch").then(({ default: fetch }) => fetch(url, init));

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

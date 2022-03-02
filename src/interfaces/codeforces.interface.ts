import type { Snowflake } from "discord.js";
import CodeforcesProblem from "../entity/codeforces/problem.entity";

export interface RandomProblemGenerateConfig {
  minRating: number;
  maxRating: number;
  topic: string;
}

export interface SubscriptionObserverPayload {
  discordId: Snowflake;
  handle: string;
}

export interface UserSubmission {
  creationTimeSeconds: number;
  problem: CodeforcesProblem;
  verdict: string;
}

export type CodeforcesResponse<T> = {
  status: string;
  result: T;
};

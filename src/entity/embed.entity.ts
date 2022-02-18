import { ColorResolvable } from "discord.js";

export interface Embed {
  title: string;
  description: string;
  color: ColorResolvable;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

import type { ColorResolvable, Snowflake, TextBasedChannel } from "discord.js";
import { concatMapTo, interval, map } from "rxjs";
import type { Subscription, Observer } from "rxjs";
import { injectable, singleton } from "tsyringe";
import type {
  CodeforcesResponse,
  SubscriptionObserverPayload,
  UserSubmission,
} from "../../interfaces/codeforces.interface";
import { fromFetch } from "rxjs/fetch";
import MessageService from "../utilities/message.service";

@singleton()
@injectable()
export default class CFSubscriptionService {
  // Keep track of people that a user subscribe to
  private userToSubscriber: Map<Snowflake, string[]>;

  // Keep track of those that subscribe to a handle
  private handleToFollower: Map<string, Snowflake[]>;

  private snowflakeToChannelObj: Map<Snowflake, TextBasedChannel>;

  // Keep track of most recent submission time of a handle
  private handleMostRecentTime: Map<string, number>;

  private handleToObservers: Map<string, Subscription>;

  private verdictColorMapping: Record<string, ColorResolvable>;
  private ignoredVerdict: string[];

  private shouldUpdate(handle: string, submissionTime: number): boolean {
    const currentTime = Date.now();
    if (!this.handleMostRecentTime.has(handle)) {
      this.handleMostRecentTime.set(handle, submissionTime);
      return currentTime <= submissionTime;
    }

    return this.handleMostRecentTime.get(handle)! < submissionTime;
  }

  private getVerdictColor(verdict: string): ColorResolvable {
    if (!this.verdictColorMapping.hasOwnProperty(verdict)) return "RED";
    return this.verdictColorMapping[verdict];
  }

  private createSubscription(handle: string) {
    const subscriptionObserver: Observer<UserSubmission> = {
      next: (value) => {
        if (
          !this.handleToFollower.has(handle) ||
          this.ignoredVerdict.includes(value.verdict)
        )
          return;
        const submissionTime = value.creationTimeSeconds;
        if (!this.shouldUpdate(handle, submissionTime)) return;
        Promise.all(
          this.handleToFollower.get(handle)!.map((snowflake) => {
            const messageObj = this.snowflakeToChannelObj.get(snowflake);
            if (messageObj) {
              return this.messageService.sendEmbedMessage(messageObj, {
                color: this.getVerdictColor(value.verdict),
                description: `${handle} just made a submission with verdict ${value.verdict}`,
              });
            }
          })
        );
        this.handleMostRecentTime.set(handle, submissionTime);
      },
      error: (err) => {},
      complete: () => {},
    };

    const requestObservable = fromFetch<CodeforcesResponse<UserSubmission[]>>(
      `https://codeforces.com/api/user.status?handle=${handle}&count=1`,
      {
        selector: (response) => response.json(),
      }
    ).pipe(map((data) => data.result[0]));

    this.handleToObservers.set(
      handle,
      interval(4000)
        .pipe(concatMapTo(requestObservable))
        .subscribe(subscriptionObserver)
    );
  }

  constructor(private messageService: MessageService) {
    this.userToSubscriber = new Map<Snowflake, string[]>();
    this.handleToFollower = new Map<string, Snowflake[]>();
    this.snowflakeToChannelObj = new Map<Snowflake, TextBasedChannel>();
    this.handleMostRecentTime = new Map<string, number>();
    this.handleToObservers = new Map<string, Subscription>();
    this.verdictColorMapping = {
      OK: "GREEN",
      WRONG_ANSWER: "RED",
      TIME_LIMIT_EXCEEDED: "RED",
    };
    this.ignoredVerdict = ["TESTING"];
  }

  public subscribe({
    discordId,
    handle,
    channelObj,
  }: SubscriptionObserverPayload & {
    channelObj: TextBasedChannel;
  }): WithResponseStatusCode<{
    msg: string;
  }> {
    if (!this.userToSubscriber.has(discordId)) {
      this.userToSubscriber.set(discordId, []);
      this.snowflakeToChannelObj.set(discordId, channelObj);
    }

    if (!this.handleToFollower.has(handle)) {
      this.handleToFollower.set(handle, []);
      this.createSubscription(handle);
    }

    if (this.userToSubscriber.get(discordId)!.includes(handle)) {
      return {
        statusCode: 400,
        msg: "User already subscribed to this handle",
      };
    }

    this.userToSubscriber.get(discordId)!.push(handle);
    this.handleToFollower.get(handle)!.push(discordId);

    return {
      statusCode: 200,
      msg: "Subscription successful",
    };
  }

  public unsubscribe({
    discordId,
    handle,
  }: SubscriptionObserverPayload): WithResponseStatusCode<{ msg: string }> {
    if (
      !this.userToSubscriber.has(discordId) ||
      !this.handleToFollower.has(handle) ||
      this.userToSubscriber.get(discordId)!.includes(handle)
    ) {
      return {
        statusCode: 400,
        msg: "User haven't subscribed to this handle. Please try again",
      };
    }

    this.userToSubscriber.set(
      discordId,
      this.userToSubscriber
        .get(discordId)!
        .filter((subscriber) => subscriber !== handle)
    );
    this.handleToFollower.set(
      handle,
      this.handleToFollower
        .get(handle)!
        .filter((follower) => follower !== discordId)
    );

    if (this.userToSubscriber.get(discordId)!.length === 0) {
      this.userToSubscriber.delete(discordId);
      this.snowflakeToChannelObj.delete(discordId);
    }

    if (this.handleToFollower.get(handle)!.length === 0) {
      this.handleToFollower.delete(handle);
      this.handleToObservers.delete(handle);
    }

    return {
      statusCode: 200,
      msg: "Unsubscription successful",
    };
  }
}

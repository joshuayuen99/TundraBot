import { TextChannel } from "discord.js";
import { TundraBot } from "../base/TundraBot";
import Poll from "../commands/utility/poll";
import { DBPoll, pollModel } from "../models/Poll";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class CheckEvents extends StartupHelper {
    DBPollManager: DBPoll;
    PollCommand: Poll;
    constructor(client: TundraBot) {
        super(client);
        this.DBPollManager = Deps.get<DBPoll>(DBPoll);
        this.PollCommand = Deps.get<Poll>(Poll);
    }

    async init(): Promise<void> {
        pollModel.find().then(async (polls) => {
            const dateNow = new Date(Date.now());
            for (const poll of polls) {
                try {
                    // Fetch poll message if not cached already
                    if (!this.client.guilds.cache.has(poll.guildID)) {
                        throw new Error(`Guild was deleted? (${poll.guildID})`);
                    }
                    const channel = await this.client.channels.fetch(poll.channelID).catch(() => {
                        throw new Error(`Channel was deleted? (${poll.channelID})`);
                    }) as TextChannel;

                    await channel.messages.fetch(poll.messageID).catch(() => {
                        throw new Error("Poll was deleted manually");
                    });

                    // Poll is still ongoing
                    if (poll.endTime > dateNow) {
                        setTimeout(() => {
                            this.PollCommand.pollHandleFinish(this.client, poll);
                            this.DBPollManager.delete(poll);
                        }, poll.endTime.valueOf() - dateNow.valueOf());
                    } else { // Poll is finished
                        this.PollCommand.pollHandleFinish(this.client, poll);
                        this.DBPollManager.delete(poll);
                    }
                } catch (err) {
                    // remove poll from database
                    Logger.log("warn", `Removing poll from database:\n${err}`);
                    this.DBPollManager.delete(poll);
                }
            }
            Logger.log("ready", `Loaded ${polls.length} polls`);
        }).catch((err) => {
            Logger.log("error", `Error loading polls in CheckPolls:\n${err}`);
        });
    }
}
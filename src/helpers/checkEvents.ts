import { TextChannel } from "discord.js";
import { TundraBot } from "../base/TundraBot";
import Event from "../commands/utility/event";
import { DBEvent, eventModel } from "../models/Event";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class CheckEvents extends StartupHelper {
    DBEventManager: DBEvent;
    EventCommand: Event;
    constructor(client: TundraBot) {
        super(client);
        this.DBEventManager = Deps.get<DBEvent>(DBEvent);
        this.EventCommand = Deps.get<Event>(Event);
    }

    async init(): Promise<void> {
        eventModel
            .find()
            .then(async (events) => {
                const dateNow = new Date(Date.now());
                for (const event of events) {
                    try {
                        // Fetch event message if not cached already
                        if (!this.client.guilds.cache.has(event.guildID)) {
                            throw new Error(
                                `Guild was deleted (${event.guildID})`
                            );
                        }
                        
                        const channel = await this.client.channels
                            .fetch(event.channelID)
                            .catch(() => {
                                throw new Error(
                                    `Channel was deleted (${event.channelID})`
                                );
                            }) as TextChannel;
                        
                        await channel.messages
                            .fetch(event.messageID)
                            .catch(() => {
                                throw new Error(
                                    "Event message was deleted manually"
                                );
                            });

                        // load into databaseCache
                        this.client.databaseCache.events.set(
                            event.messageID,
                            event
                        );

                        // Event is still ongoing
                        if (event.endTime > dateNow) {
                            setTimeout(() => {
                                this.EventCommand.eventHandleFinish(
                                    this.client,
                                    event
                                );
                            }, event.endTime.getTime() - dateNow.getTime());
                        } else {
                            // Poll is finished
                            this.EventCommand.eventHandleFinish(
                                this.client,
                                event
                            );
                        }
                    } catch (err) {
                        // remove event from database
                        Logger.log("warn", `Deleting event from database:\n${err}`);
                        this.DBEventManager.delete(event).catch(() => {
                            Logger.log(
                                "error",
                                "Couldn't delete event from database"
                            );
                        });
                    }
                }
                Logger.log("ready", `Loaded ${events.length} events`);
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error loading events in CheckEvents:\n${err}`
                );
            });
    }
}

import { StartupHelper } from "./startupHelper";
import Logger from "../utils/logger";
import { TundraBot } from "../base/TundraBot";
import { guildModel } from "../models/Guild";

export default class CacheMembers extends StartupHelper {
    async init(): Promise<void> {
        guildModel.find({ "leaveMessages.enabled": true }).then(async (guilds) => {
            async function cacheMembers(client: TundraBot) {
                for (const guild of guilds) {
                    // Check if guild was deleted
                    if (!client.guilds.cache.has(guild.guildID)) {
                        // console.error(`Guild was deleted? (${guild.guildID})`);
                        continue;
                    }

                    client.guilds.cache.get(guild.guildID).members.fetch();
                }
            }
            await cacheMembers(this.client);
            Logger.log("ready", `Cached ${this.client.users.cache.size} users`);
        }).catch((err) => {
            Logger.log("error", `cacheMembers init error:\n${err}`);
        });
    }
}
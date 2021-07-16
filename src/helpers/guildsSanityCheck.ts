import { TundraBot } from "../base/TundraBot";
import GuildCreateHandler from "../events/guildCreate";
import { DBGuild, guildModel } from "../models/Guild";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class GuildsSanityCheck extends StartupHelper {
    DBGuildManager: DBGuild;
    GuildCreateHandler: GuildCreateHandler;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
        this.GuildCreateHandler = Deps.get<GuildCreateHandler>(GuildCreateHandler);
    }

    async init(): Promise<void> {
        guildModel.find().then(async (guilds) => {
            // Check for newly left guilds
            for (const guild of guilds) {
                try {
                    // Check if guild was deleted
                    if (!this.client.guilds.cache.has(guild.guildID)) {
                        throw new Error(`Guild was deleted (${guild.guildID})`);
                    }
                } catch (err) {
                    Logger.log("warn", err);
                }
            }

            // Check for newly joined guilds
            for (const cachedGuild of this.client.guilds.cache) {
                let newGuilds = 0;
                // New guild without defaults set yet
                if (
                    !guilds.some((guild) => guild.guildID === cachedGuild[1].id)
                ) {
                    // Create defaults
                    this.GuildCreateHandler.invoke(cachedGuild[1]);
                    newGuilds++;
                }

                if (newGuilds > 0) {
                    Logger.log("ready", `Created defaults for ${newGuilds} new guilds`);
                }
            }
        });
    }
}
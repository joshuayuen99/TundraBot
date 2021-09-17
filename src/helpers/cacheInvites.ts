import { StartupHelper } from "./startupHelper";
import Logger from "../utils/logger";
import { TundraBot } from "../base/TundraBot";
import { DBGuild, guildModel } from "../models/Guild";
import Deps from "../utils/deps";
import { Guild, Permissions, Snowflake } from "discord.js";
import { CachedInvite } from "../events/inviteCreate";

export default class CacheInvites extends StartupHelper {
    DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async init(): Promise<void> {
        guildModel
            .find({ "joinMessages.enabled": true })
            .then(async (guilds) => {
                let totalInvites = 0;
                for (const guild of guilds) {
                    try {
                        // Check if guild was deleted
                        if (!this.client.guilds.cache.has(guild.guildID)) {
                            throw new Error(
                                `Guild was deleted (${guild.guildID})`
                            );
                        }

                        const discordGuild = await this.client.guilds.fetch(
                            guild.guildID
                        );
                        totalInvites += await CacheInvites.cacheInvites(
                            this.client,
                            discordGuild
                        );
                    } catch (err) {
                        return;
                    }
                }
                Logger.log("ready",
                    `Cached ${totalInvites} invites in ${this.client.guildInvites.size} guilds`
                );
            })
            .catch((err) => {
                Logger.log("error", `cacheInvites init error:\n${err}`);
            });
    }

    /**
     * 
     * @param client 
     * @param guild 
     * @returns the number of invites cached
     */
    static async cacheInvites(client: TundraBot, guild: Guild): Promise<number> {
        // Check if we have the permissions we need
        if (!guild.me.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
            return 0;
        }

        let inviteCount = 0;
        await guild
            .invites.fetch()
            .then((invites) => {
                for (const invite of invites) {
                    let currentInvites = client.guildInvites.get(guild.id);
                    if (!currentInvites) currentInvites = new Map<Snowflake, CachedInvite>();
                    const cachedInvite: CachedInvite = {
                        code: invite[1].code,
                        uses: invite[1].uses,
                    };
                    currentInvites.set(invite[0], cachedInvite);
                    client.guildInvites.set(guild.id, currentInvites);
                }
                inviteCount += invites.size;
            })
            .catch((err) => {
                Logger.log("error", `fetchInvites error (guildID: ${guild.id}):\n${err}`);
            });
        return inviteCount;
    }
}
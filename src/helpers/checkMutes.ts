import { TundraBot } from "../base/TundraBot";
import Unmute from "../commands/moderation/unmute";
import { DBGuild } from "../models/Guild";
import { DBMember, memberModel } from "../models/Member";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class CheckMutes extends StartupHelper {
    DBMemberManager: DBMember;
    DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async init(): Promise<void> {
        memberModel
            .find({ "mute.endTime": { $ne: null } })
            .then(async (members) => {
                const dateNow = new Date(Date.now());
                for (const member of members) {
                    try {
                        // Check if guild was deleted
                        if (!this.client.guilds.cache.has(member.guildID)) {
                            throw new Error(
                                `Guild was deleted (${member.guildID})`
                            );
                        }
                        const guild = this.client.guilds.cache.get(
                            member.guildID
                        );

                        guild.members
                            .fetch(member.userID)
                            .then(async (discordMember) => {
                                // Mute is ongoing
                                if (member.mute.endTime > dateNow) {
                                    setTimeout(async () => {
                                        try {
                                            const settings =
                                                await this.DBGuildManager.get(
                                                    guild
                                                );
                                            Unmute.unmute(
                                                this.client,
                                                guild,
                                                settings,
                                                discordMember,
                                                "Mute duration expired",
                                                null
                                            );
                                        } catch (err) {
                                            Logger.log(
                                                "error",
                                                `Error getting settings for guild (guildID: ${guild.id}) in checkMutes:\n${err}`
                                            );
                                        }
                                    }, member.mute.endTime.valueOf() - dateNow.valueOf());
                                } else {
                                    // Mute is done
                                    try {
                                        const settings =
                                            await this.DBGuildManager.get(
                                                guild
                                            );
                                        Unmute.unmute(
                                            this.client,
                                            guild,
                                            settings,
                                            discordMember,
                                            "Mute duration expired",
                                            null
                                        );
                                    } catch (err) {
                                        Logger.log(
                                            "error",
                                            `Error getting settings for guild (guildID: ${guild.id}) in checkMutes:\n${err}`
                                        );
                                    }
                                }
                            })
                            .catch(() => {
                                // muted member left the server
                            });
                    } catch (err) {
                        Logger.log("error", `Error unmuting member (userID: ${member.userID}) (guildID: ${member.guildID}) in checkMutes:\n${err}`);
                    }
                }
                Logger.log("ready", `Loaded ${members.length} mutes`);
            })
            .catch((err) => {
                Logger.log("error", `Error loading mutes from database:\n${err}`);
            });
    }
}
import { TundraBot } from "../base/TundraBot";
import Ban from "../commands/moderation/ban";
import { DBGuild } from "../models/Guild";
import { DBMember, memberModel } from "../models/Member";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class CheckBans extends StartupHelper {
    DBMemberManager: DBMember;
    DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async init(): Promise<void> {
        memberModel
            .find({ "ban.endTime": { $ne: null } })
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

                        // Ban is ongoing
                        if (member.ban.endTime > dateNow) {
                            setTimeout(async () => {
                                try {
                                    const settings =
                                        await this.DBGuildManager.get(guild);
                                    Ban.unban(
                                        this.client,
                                        guild,
                                        settings,
                                        member.userID,
                                        "Ban duration expired",
                                        null
                                    );
                                } catch (err) {
                                    Logger.log(
                                        "error",
                                        `Error getting settings for guild in checkBans:\n${err}`
                                    );
                                }
                            }, member.ban.endTime.valueOf() - dateNow.valueOf());
                        } else {
                            // Ban is done
                            try {
                                const settings = await this.DBGuildManager.get(
                                    guild
                                );
                                Ban.unban(
                                    this.client,
                                    guild,
                                    settings,
                                    member.userID,
                                    "Ban duration expired",
                                    null
                                );
                            } catch (err) {
                                Logger.log(
                                    "error",
                                    `Error getting settings for guild in checkBans:\n${err}`
                                );
                            }
                        }
                    } catch (err) {
                        Logger.log(
                            "error",
                            `Error unbanning member in checkBans:\n${err}`
                        );
                    }
                }
                Logger.log("ready", `Loaded ${members.length} bans`);
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error loading bans from database:\n${err}`
                );
            });
    }
}

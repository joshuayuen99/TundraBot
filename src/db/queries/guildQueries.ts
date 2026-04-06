import { Logger } from "../../utils/Logger.ts";
import { DB } from "../db.ts";
import { guildsTable, type Guild } from "../schema/guild.ts";

export async function insertGuild(guild: Guild) {
    Logger.debug(`Inserting new guild into DB`);
    return DB.insert(guildsTable).values(guild).onConflictDoNothing();
}

export async function ensureGuildExists(guildId: bigint) {
    const guild: Guild = {
        id: guildId,
    };
    insertGuild(guild);
}

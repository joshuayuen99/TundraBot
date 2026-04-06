import { Logger } from "../../utils/Logger.ts";
import { DB } from "../db.ts";
import { channelsTable, type Channel } from "../schema/channel.ts";
import { ensureGuildExists } from "./guildQueries.ts";

export async function insertChannel(channel: Channel) {
    Logger.debug(`Inserting new channel into DB`);
    return DB.insert(channelsTable).values(channel).onConflictDoNothing();
}

export async function ensureGuildChannelExists(
    channelId: bigint,
    guildId: bigint
) {
    const channel: Channel = {
        id: channelId,
        guildId: guildId,
    };
    await ensureGuildExists(guildId);
    await insertChannel(channel);
}

export async function ensureDMChannelExists(channelId: bigint) {
    const channel: Channel = {
        id: channelId,
        guildId: null,
    };
    await insertChannel(channel);
}

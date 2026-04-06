import { DB } from "../db.ts";
import { messagesTable, type Message } from "../schema/message.ts";
import { ensureUserExists } from "./userQueries.ts";
import { ensureGuildChannelExists } from "./channelQueries.ts";

export async function insertGuildMessage(message: Message, guildId: bigint) {
    await ensureGuildChannelExists(message.channelId, guildId);
    await ensureUserExists(message.authorId);

    return DB.insert(messagesTable).values(message).onConflictDoNothing();
}

export async function insertDMMessage(message: Message) {
    await ensureUserExists(message.authorId);

    return DB.insert(messagesTable).values(message).onConflictDoNothing();
}

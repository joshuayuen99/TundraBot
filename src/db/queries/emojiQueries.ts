import { Logger } from "../../utils/Logger.ts";
import { DB } from "../db.ts";
import { emojisTable, type Emoji } from "../schema/emoji.ts";

export async function insertEmoji(emoji: Emoji): Promise<Emoji | null> {
    Logger.debug(`Inserting new emoji into DB`);
    const [row] = await DB.insert(emojisTable)
        .values(emoji)
        .onConflictDoNothing()
        .returning();

    return row ?? null;
}

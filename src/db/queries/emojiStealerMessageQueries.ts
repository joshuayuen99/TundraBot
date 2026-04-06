import { Logger } from "../../utils/Logger.ts";
import { DB } from "../db.ts";
import {
    emojiStealerMessagesTable,
    type EmojiStealer,
} from "../schema/emojiStealerMessage.ts";

export async function insertEmojiStealerMessage(
    emojiStealerMessage: EmojiStealer
) {
    Logger.debug(`Inserting new emoji stealer message into DB`);
    return DB.insert(emojiStealerMessagesTable)
        .values(emojiStealerMessage)
        .onConflictDoNothing();
}

export interface EmojiInfo {
    url: string;
    emojiName: string;
}

export async function getEmojiInfoFromMessageId(
    messageId: bigint
): Promise<EmojiInfo | null> {
    const emojiInfo = await DB.query.emojiStealerMessagesTable.findFirst({
        columns: { emojiName: true },
        where: {
            messageId: messageId,
        },
        with: {
            emoji: {
                columns: {
                    url: true,
                },
            },
        },
    });

    if (!emojiInfo) return null;

    return {
        url: emojiInfo.emoji.url,
        emojiName: emojiInfo.emojiName,
    };
}

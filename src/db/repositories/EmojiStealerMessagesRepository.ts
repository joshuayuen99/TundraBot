import { Logger } from "../../utils/Logger.ts";
import { Env, getEnv } from "../../utils/loadEnvironmentVars.ts";
import { type DBType } from "../db.ts";
import {
    emojiStealerMessagesTable,
    type EmojiStealer,
} from "../schema/emojiStealerMessage.ts";
import type { EmojiRepository } from "./EmojiRepository.ts";
import type { MessageRepository } from "./MessageRepository.ts";

export class EmojiStealerMessageRepository {
    protected db: DBType;
    protected messageRepository: MessageRepository;
    protected emojiRepository: EmojiRepository;

    constructor(
        db: DBType,
        messageRepository: MessageRepository,
        emojiRepository: EmojiRepository
    ) {
        this.db = db;
        this.messageRepository = messageRepository;
        this.emojiRepository = emojiRepository;
    }

    async getEmojiInfoFromMessageId(
        messageId: bigint
    ): Promise<EmojiInfo | null> {
        const emojiInfo =
            await this.db.query.emojiStealerMessagesTable.findFirst({
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

    protected async create(emojiStealerMessage: EmojiStealer) {
        Logger.debug(`Inserting new emoji stealer message into DB`);
        return this.db
            .insert(emojiStealerMessagesTable)
            .values(emojiStealerMessage)
            .onConflictDoNothing();
    }

    async createEmojiStealerMessage(
        messageId: bigint,
        emojiId: string,
        guildEmojiId: bigint,
        emojiName: string,
        channelId: bigint,
        guildId: bigint
    ) {
        const emojiStealer: EmojiStealer = {
            messageId: messageId,
            emojiId: emojiId,
            guildEmojiId: guildEmojiId,
            emojiName: emojiName,
        };
        await this.messageRepository.createGuildMessage(
            messageId,
            channelId,
            BigInt(getEnv(Env.BOT_ID)),
            guildId
        );
        return this.create(emojiStealer);
    }
}

interface EmojiInfo {
    url: string;
    emojiName: string;
}

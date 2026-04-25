import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    test,
} from "@jest/globals";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";

import type { createDbConnection } from "../../src/db/db.ts";
import type { EmojiRepository } from "../../src/db/repositories/EmojiRepository.ts";
import type { EmojiStealerMessageRepository } from "../../src/db/repositories/EmojiStealerMessagesRepository.ts";
import type { MessageRepository } from "../../src/db/repositories/MessageRepository.ts";
import { channelsTable } from "../../src/db/schema/channel.ts";
import { emojisTable } from "../../src/db/schema/emoji.ts";
import { emojiStealerMessagesTable } from "../../src/db/schema/emojiStealerMessage.ts";
import { guildsTable } from "../../src/db/schema/guild.ts";
import { messagesTable } from "../../src/db/schema/message.ts";
import { usersTable } from "../../src/db/schema/user.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let emojiRepository: EmojiRepository;
let emojiStealerMessageRepository: EmojiStealerMessageRepository;
let messageRepository: MessageRepository;
const BOT_ID = "123456789";

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    emojiRepository = common.repos.emojiRepository;
    emojiStealerMessageRepository = common.repos.emojiStealerMessageRepository;
    messageRepository = common.repos.messageRepository;

    process.env["BOT_ID"] = BOT_ID;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(emojiStealerMessagesTable);
    await db.delete(emojisTable);
    await db.delete(messagesTable);
    await db.delete(channelsTable);
    await db.delete(guildsTable);
    await db.delete(usersTable);
});

describe("DB emoji stealer message tests", () => {
    test("Create an emoji stealer message in the DB by IDs", async () => {
        const channelId = BigInt(123);
        const emojiName = "exampleEmoji";
        const emojiUrl = "https://example.com";
        const guildId = BigInt(234);
        const guildEmojiId = BigInt(345);
        const messageId = BigInt(456);

        const emojiRow = await emojiRepository.createByUrl(emojiUrl);
        await emojiStealerMessageRepository.createEmojiStealerMessage(
            messageId,
            emojiRow!.id!,
            guildEmojiId,
            emojiName,
            channelId,
            guildId
        );

        const emojiInfo =
            await emojiStealerMessageRepository.getEmojiInfoFromMessageId(
                messageId
            );

        expect(emojiInfo).toBeDefined();
        expect(emojiInfo!.url).toBe(emojiUrl);
        expect(emojiInfo!.emojiName).toBe(emojiName);
    });

    test("Ensure the author ID of the underlying stealer message is our BOT_ID", async () => {
        const channelId = BigInt(123);
        const emojiName = "exampleEmoji";
        const emojiUrl = "https://example.com";
        const guildId = BigInt(234);
        const guildEmojiId = BigInt(345);
        const messageId = BigInt(456);

        const emojiRow = await emojiRepository.createByUrl(emojiUrl);
        await emojiStealerMessageRepository.createEmojiStealerMessage(
            messageId,
            emojiRow!.id!,
            guildEmojiId,
            emojiName,
            channelId,
            guildId
        );

        const messageRow = await messageRepository.findById(messageId);

        expect(messageRow!.authorId).toBe(BigInt(BOT_ID));
    });

    test("Ensure that we do not throw when trying to insert a message that already exists", async () => {
        const channelId = BigInt(123);
        const emojiName = "exampleEmoji";
        const emojiUrl = "https://example.com";
        const guildId = BigInt(234);
        const guildEmojiId = BigInt(345);
        const messageId = BigInt(456);

        const emojiRow = await emojiRepository.createByUrl(emojiUrl);
        await emojiStealerMessageRepository.createEmojiStealerMessage(
            messageId,
            emojiRow!.id!,
            guildEmojiId,
            emojiName,
            channelId,
            guildId
        );
        await emojiStealerMessageRepository.createEmojiStealerMessage(
            messageId,
            emojiRow!.id!,
            guildEmojiId,
            emojiName,
            channelId,
            guildId
        );
    });
});

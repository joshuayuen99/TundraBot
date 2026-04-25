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
import type { ChannelRepository } from "../../src/db/repositories/ChannelRepository.ts";
import type { GuildRepository } from "../../src/db/repositories/GuildRepository.ts";
import type { MessageRepository } from "../../src/db/repositories/MessageRepository.ts";
import { UserRepository } from "../../src/db/repositories/UserRepository.ts";
import { channelsTable } from "../../src/db/schema/channel.ts";
import { guildsTable } from "../../src/db/schema/guild.ts";
import { messagesTable } from "../../src/db/schema/message.ts";
import { usersTable } from "../../src/db/schema/user.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let channelRepository: ChannelRepository;
let guildRepository: GuildRepository;
let messageRepository: MessageRepository;
let userRepository: UserRepository;

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    channelRepository = common.repos.channelRepository;
    guildRepository = common.repos.guildRepository;
    messageRepository = common.repos.messageRepository;
    userRepository = common.repos.userRepository;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(messagesTable);
    await db.delete(channelsTable);
    await db.delete(guildsTable);
    await db.delete(usersTable);
});

describe("DB message tests", () => {
    test("Create a guild message in the DB by IDs", async () => {
        const channelId = BigInt(123);
        const guildId = BigInt(234);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createGuildMessage(
            messageId,
            channelId,
            userId,
            guildId
        );

        const messageRow = await messageRepository.findById(messageId);

        expect(messageRow).toBeDefined();
        expect(messageRow?.id).toBe(messageId);
        expect(messageRow?.channelId).toBe(channelId);
        expect(messageRow?.authorId).toBe(userId);
    });

    test("Create a DM message in the DB by IDs", async () => {
        const channelId = BigInt(123);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createDMMessage(messageId, channelId, userId);

        const messageRow = await messageRepository.findById(messageId);

        expect(messageRow).toBeDefined();
        expect(messageRow?.id).toBe(messageId);
        expect(messageRow?.channelId).toBe(channelId);
        expect(messageRow?.authorId).toBe(userId);
    });

    test("Creating a guild message automatically creates the underlying user", async () => {
        const channelId = BigInt(123);
        const guildId = BigInt(234);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createGuildMessage(
            messageId,
            channelId,
            userId,
            guildId
        );

        const userRow = await userRepository.findById(userId);

        expect(userRow).toBeDefined();
        expect(userRow?.id).toBe(userId);
    });

    test("Creating a DM message automatically creates the underlying user", async () => {
        const channelId = BigInt(123);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createDMMessage(messageId, channelId, userId);

        const userRow = await userRepository.findById(userId);

        expect(userRow).toBeDefined();
        expect(userRow?.id).toBe(userId);
    });

    test("Creating a guild message automatically creates the underlying channel", async () => {
        const channelId = BigInt(123);
        const guildId = BigInt(234);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createGuildMessage(
            messageId,
            channelId,
            userId,
            guildId
        );

        const channelRow = await channelRepository.findById(channelId);

        expect(channelRow).toBeDefined();
        expect(channelRow?.id).toBe(channelId);
    });

    test("Creating a DM message automatically creates the underlying channel", async () => {
        const channelId = BigInt(123);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createDMMessage(messageId, channelId, userId);

        const channelRow = await channelRepository.findById(channelId);

        expect(channelRow).toBeDefined();
        expect(channelRow?.id).toBe(channelId);
    });

    test("Creating a guild message automatically creates the underlying guild", async () => {
        const channelId = BigInt(123);
        const guildId = BigInt(234);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createGuildMessage(
            messageId,
            channelId,
            userId,
            guildId
        );

        const guildRow = await guildRepository.findById(guildId);

        expect(guildRow).toBeDefined();
        expect(guildRow?.id).toBe(guildId);
    });

    test("Ensure that we do not throw when trying to insert a message that already exists", async () => {
        const channelId = BigInt(123);
        const guildId = BigInt(234);
        const messageId = BigInt(345);
        const userId = BigInt(456);

        await messageRepository.createGuildMessage(
            messageId,
            channelId,
            userId,
            guildId
        );
        await messageRepository.createGuildMessage(
            messageId,
            channelId,
            userId,
            guildId
        );

        await messageRepository.createDMMessage(messageId, channelId, userId);
        await messageRepository.createDMMessage(messageId, channelId, userId);
    });
});

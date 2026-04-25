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
import { channelsTable } from "../../src/db/schema/channel.ts";
import { guildsTable } from "../../src/db/schema/guild.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let channelRepository: ChannelRepository;
let guildRepository: GuildRepository;

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    channelRepository = common.repos.channelRepository;
    guildRepository = common.repos.guildRepository;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(channelsTable);
    await db.delete(guildsTable);
});

describe("DB channel tests", () => {
    test("Create a guild channel in the DB by ID", async () => {
        const channelId = BigInt(999);
        const guildId = BigInt(123);

        await channelRepository.createGuildChannelById(channelId, guildId);

        const channelRow = await channelRepository.findById(channelId);

        expect(channelRow).toBeDefined();
        expect(channelRow?.guildId).toBe(guildId);
    });

    test("Create a DM channel in the DB by ID", async () => {
        const channelId = BigInt(999);

        await channelRepository.createDMChannelById(channelId);

        const channelRow = await channelRepository.findById(channelId);

        expect(channelRow).toBeDefined();
        expect(channelRow?.guildId).toBeNull();
    });

    test("Creating a guild channel automatically creates the underlying guild", async () => {
        const channelId = BigInt(999);
        const guildId = BigInt(123);

        await channelRepository.createGuildChannelById(channelId, guildId);

        const guildRow = await guildRepository.findById(guildId);

        expect(guildRow).toBeDefined();
        expect(guildRow?.id).toBe(guildId);
    });

    test("Ensure that we do not throw when trying to insert a channel that already exists", async () => {
        const channelId = BigInt(999);

        await channelRepository.createDMChannelById(channelId);
        await channelRepository.createDMChannelById(channelId);
    });
});

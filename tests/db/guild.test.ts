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
import type { GuildRepository } from "../../src/db/repositories/GuildRepository.ts";
import { guildsTable } from "../../src/db/schema/guild.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let guildRepository: GuildRepository;

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    guildRepository = common.repos.guildRepository;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(guildsTable);
});

describe("DB guild tests", () => {
    test("Create a guild in the DB by ID", async () => {
        const guildId = BigInt(123);

        await guildRepository.createById(guildId);

        const guildRow = await guildRepository.findById(guildId);

        expect(guildRow).toBeDefined();
        expect(guildRow?.id).toBe(guildId);
    });

    test("Ensure that we do not throw when trying to insert a guild that already exists", async () => {
        const guildId = BigInt(123);

        await guildRepository.createById(guildId);
        await guildRepository.createById(guildId);
    });
});

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
import { emojisTable } from "../../src/db/schema/emoji.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let emojiRepository: EmojiRepository;

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    emojiRepository = common.repos.emojiRepository;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(emojisTable);
});

describe("DB emoji tests", () => {
    test("Create an emoji in the DB by URL", async () => {
        const url = "https://example.com";

        const emojiRow = await emojiRepository.createByUrl(url);
        const foundEmojiRow = await emojiRepository.findById(emojiRow!.id!);

        expect(foundEmojiRow).toBeDefined();
        expect(foundEmojiRow?.url).toBe(url);
    });

    test("Ensure that we do not throw when trying to insert an emoji that already exists", async () => {
        const url = "https://example.com";

        await emojiRepository.createByUrl(url);
        await emojiRepository.createByUrl(url);
    });
});

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
import { UserRepository } from "../../src/db/repositories/UserRepository.ts";
import { usersTable } from "../../src/db/schema/user.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let userRepository: UserRepository;

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    userRepository = common.repos.userRepository;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(usersTable);
});

describe("DB user tests", () => {
    test("Create a user in the DB by ID", async () => {
        const userId = BigInt(123);

        await userRepository.createById(userId);

        const userRow = await userRepository.findById(userId);

        expect(userRow).toBeDefined();
        expect(userRow?.id).toBe(userId);
    });

    test("Ensure that we do not throw when trying to insert a user that already exists", async () => {
        const userId = BigInt(123);

        await userRepository.createById(userId);
        await userRepository.createById(userId);
    });
});

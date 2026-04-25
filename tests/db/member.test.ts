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
import type { MemberRepository } from "../../src/db/repositories/MemberRepository.ts";
import type { UserRepository } from "../../src/db/repositories/UserRepository.ts";
import { guildsTable } from "../../src/db/schema/guild.ts";
import { membersTable } from "../../src/db/schema/member.ts";
import { usersTable } from "../../src/db/schema/user.ts";
import { initCommon } from "./setup.ts";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof createDbConnection>;
let guildRepository: GuildRepository;
let memberRepository: MemberRepository;
let userRepository: UserRepository;

beforeAll(async () => {
    const common = await initCommon();
    container = common.container;
    pool = common.pool;
    db = common.db;
    guildRepository = common.repos.guildRepository;
    memberRepository = common.repos.memberRepository;
    userRepository = common.repos.userRepository;
}, 60_000);

afterAll(async () => {
    await pool.end();
    await container.stop({ timeout: 10_000 });
});

afterEach(async () => {
    await db.delete(membersTable);
    await Promise.all([db.delete(guildsTable), db.delete(usersTable)]);
});

describe("DB member tests", () => {
    test("Create a member in the DB by ID", async () => {
        const userId = BigInt(999);
        const guildId = BigInt(123);

        await memberRepository.createByUserAndGuildIds(userId, guildId);

        const memberRow = await memberRepository.findByUserAndGuildIds(
            userId,
            guildId
        );

        expect(memberRow).toBeDefined();
        expect(memberRow?.userId).toBe(userId);
        expect(memberRow?.guildId).toBe(guildId);
    });

    test("Creating a member automatically creates the underlying user", async () => {
        const userId = BigInt(999);
        const guildId = BigInt(123);

        await memberRepository.createByUserAndGuildIds(userId, guildId);

        const userRow = await userRepository.findById(userId);

        expect(userRow).toBeDefined();
        expect(userRow?.id).toBe(userId);
    });

    test("Creating a member automatically creates the underlying guild", async () => {
        const userId = BigInt(999);
        const guildId = BigInt(123);

        await memberRepository.createByUserAndGuildIds(userId, guildId);

        const guildRow = await guildRepository.findById(guildId);

        expect(guildRow).toBeDefined();
        expect(guildRow?.id).toBe(guildId);
    });

    test("Ensure that we do not throw when trying to insert a member that already exists", async () => {
        const userId = BigInt(999);
        const guildId = BigInt(123);

        await memberRepository.createByUserAndGuildIds(userId, guildId);
        await memberRepository.createByUserAndGuildIds(userId, guildId);
    });
});

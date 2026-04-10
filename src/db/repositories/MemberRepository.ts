import { Logger } from "../../utils/Logger.ts";
import { type DBType } from "../db.ts";
import { membersTable, type Member } from "../schema/member.ts";
// import { ensureUserExists } from "./UserRepository.ts";
import { GuildRepository } from "./GuildRepository.ts";
import type { UserRepository } from "./UserRepository.ts";

export class MemberRepository {
    protected db: DBType;
    protected guildRepository: GuildRepository;
    protected userRepository: UserRepository;

    constructor(
        db: DBType,
        guildRepository: GuildRepository,
        userRepository: UserRepository
    ) {
        this.db = db;
        this.guildRepository = guildRepository;
        this.userRepository = userRepository;
    }

    async findByUserAndGuildIds(userId: bigint, guildId: bigint) {
        return this.db.query.membersTable.findFirst({
            where: {
                userId: userId,
                guildId: guildId,
            },
        });
    }

    protected async create(member: Member) {
        await this.userRepository.createById(member.userId);
        await this.guildRepository.createById(member.guildId);

        Logger.debug(`Inserting new member into DB`);
        return this.db
            .insert(membersTable)
            .values(member)
            .onConflictDoNothing();
    }

    async createByUserAndGuildIds(userId: bigint, guildId: bigint) {
        const member: Member = {
            userId: userId,
            guildId: guildId,
        };
        return this.create(member);
    }
}

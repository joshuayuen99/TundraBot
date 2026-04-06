import { Logger } from "../../utils/Logger.ts";
import { DB } from "../db.ts";
import { membersTable, type Member } from "../schema/member.ts";
import { ensureGuildExists } from "./guildQueries.ts";
import { ensureUserExists } from "./userQueries.ts";

export async function insertMember(member: Member) {
    await ensureUserExists(member.userId);
    await ensureGuildExists(member.guildId);

    Logger.debug(`Inserting new member into DB`);
    return DB.insert(membersTable).values(member).onConflictDoNothing();
}

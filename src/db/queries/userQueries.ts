import { Logger } from "../../utils/Logger.ts";
import { DB } from "../db.ts";
import { usersTable, type User } from "../schema/user.ts";

export async function insertUser(user: User) {
    Logger.debug(`Inserting new user into DB`);
    return DB.insert(usersTable).values(user).onConflictDoNothing();
}

export async function ensureUserExists(userId: bigint) {
    const user: User = {
        id: userId,
    };
    await insertUser(user);
}

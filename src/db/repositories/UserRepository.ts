import { Logger } from "../../utils/Logger.ts";
import type { DBType } from "../db.ts";
import { usersTable, type User } from "../schema/user.ts";

export class UserRepository {
    protected db: DBType;

    constructor(db: DBType) {
        this.db = db;
    }

    async findById(userId: bigint) {
        return this.db.query.usersTable.findFirst({
            where: {
                id: userId,
            },
        });
    }

    async create(user: User) {
        Logger.debug(`Inserting new user into DB`);
        return this.db.insert(usersTable).values(user).onConflictDoNothing();
    }

    async createById(userId: bigint) {
        const user: User = {
            id: userId,
        };
        return this.create(user);
    }
}

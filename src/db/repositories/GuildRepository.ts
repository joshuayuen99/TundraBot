import { Logger } from "../../utils/Logger.ts";
import { type DBType } from "../db.ts";
import { guildsTable, type Guild } from "../schema/guild.ts";

export class GuildRepository {
    protected db: DBType;

    constructor(db: DBType) {
        this.db = db;
    }

    async findById(guildId: bigint) {
        return this.db.query.guildsTable.findFirst({
            where: {
                id: guildId,
            },
        });
    }

    protected async create(guild: Guild) {
        Logger.debug(`Inserting new guild into DB`);
        return this.db.insert(guildsTable).values(guild).onConflictDoNothing();
    }

    async createById(guildId: bigint) {
        const guild: Guild = {
            id: guildId,
        };

        return this.create(guild);
    }
}

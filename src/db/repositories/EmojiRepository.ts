import { Logger } from "../../utils/Logger.ts";
import { type DBType } from "../db.ts";
import { emojisTable, type Emoji } from "../schema/emoji.ts";

export class EmojiRepository {
    protected db: DBType;

    constructor(db: DBType) {
        this.db = db;
    }

    protected async create(emoji: Emoji): Promise<Emoji | null> {
        Logger.debug(`Inserting new emoji into DB`);
        const [row] = await this.db
            .insert(emojisTable)
            .values(emoji)
            .onConflictDoNothing()
            .returning();

        return row ?? null;
    }

    async createByUrl(url: string): Promise<Emoji | null> {
        const emoji: Emoji = {
            url: url,
        };
        return this.create(emoji);
    }
}

import { Logger } from "../../utils/Logger.ts";
import type { DBType } from "../db.ts";
import { channelsTable, type Channel } from "../schema/channel.ts";
import type { GuildRepository } from "./GuildRepository.ts";

export class ChannelRepository {
    protected db: DBType;
    protected guildRepository: GuildRepository;

    constructor(db: DBType, guildRepository: GuildRepository) {
        this.db = db;
        this.guildRepository = guildRepository;
    }

    async findById(channelId: bigint) {
        return this.db.query.channelsTable.findFirst({
            where: {
                id: channelId,
            },
        });
    }

    protected async create(channel: Channel) {
        Logger.debug(`Inserting new channel into DB`);
        return this.db
            .insert(channelsTable)
            .values(channel)
            .onConflictDoNothing();
    }

    async createGuildChannelById(channelId: bigint, guildId: bigint) {
        const channel: Channel = {
            id: channelId,
            guildId: guildId,
        };
        await this.guildRepository.createById(guildId);
        return this.create(channel);
    }

    async createDMChannelById(channelId: bigint) {
        const channel: Channel = {
            id: channelId,
            guildId: null,
        };
        return this.create(channel);
    }
}

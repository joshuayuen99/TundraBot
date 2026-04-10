import { Logger } from "../../utils/Logger.ts";
import { type DBType } from "../db.ts";
import { messagesTable, type Message } from "../schema/message.ts";
import { ChannelRepository } from "./ChannelRepository.ts";
import { UserRepository } from "./UserRepository.ts";

export class MessageRepository {
    protected db: DBType;
    protected channelRepository: ChannelRepository;
    protected userRepository: UserRepository;

    constructor(
        db: DBType,
        channelRepository: ChannelRepository,
        userRepository: UserRepository
    ) {
        this.db = db;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
    }

    async findById(messageId: bigint) {
        return this.db.query.messagesTable.findFirst({
            where: {
                id: messageId,
            },
        });
    }

    protected async create(message: Message) {
        Logger.debug(`Inserting new message into DB`);
        return this.db
            .insert(messagesTable)
            .values(message)
            .onConflictDoNothing();
    }

    public async createGuildMessage(
        messageId: bigint,
        channelId: bigint,
        authorId: bigint,
        guildId: bigint
    ) {
        const message: Message = {
            id: messageId,
            channelId: channelId,
            authorId: authorId,
        };
        await this.userRepository.createById(authorId);
        await this.channelRepository.createGuildChannelById(channelId, guildId);
        return this.create(message);
    }

    async createDMMessage(
        messageId: bigint,
        channelId: bigint,
        authorId: bigint
    ) {
        const message: Message = {
            id: messageId,
            channelId: channelId,
            authorId: authorId,
        };
        await this.userRepository.createById(message.authorId);
        await this.channelRepository.createDMChannelById(message.channelId);
        return this.create(message);
    }
}

import type { DBType } from "./db.ts";
import { ChannelRepository } from "./repositories/ChannelRepository.ts";
import { EmojiRepository } from "./repositories/EmojiRepository.ts";
import { EmojiStealerMessageRepository } from "./repositories/EmojiStealerMessagesRepository.ts";
import { GuildRepository } from "./repositories/GuildRepository.ts";
import { MemberRepository } from "./repositories/MemberRepository.ts";
import { MessageRepository } from "./repositories/MessageRepository.ts";
import { UserRepository } from "./repositories/UserRepository.ts";

interface Repos {
    channelRepository: ChannelRepository;
    emojiRepository: EmojiRepository;
    emojiStealerMessageRepository: EmojiStealerMessageRepository;
    guildRepository: GuildRepository;
    memberRepository: MemberRepository;
    messageRepository: MessageRepository;
    userRepository: UserRepository;
}

export function createRepositories(db: DBType): Repos {
    const guildRepository = new GuildRepository(db);
    const emojiRepository = new EmojiRepository(db);
    const channelRepository = new ChannelRepository(db, guildRepository);
    const userRepository = new UserRepository(db);
    const memberRepository = new MemberRepository(
        db,
        guildRepository,
        userRepository
    );
    const messageRepository = new MessageRepository(
        db,
        channelRepository,
        userRepository
    );
    const emojiStealerMessageRepository = new EmojiStealerMessageRepository(
        db,
        messageRepository,
        emojiRepository
    );

    return {
        channelRepository,
        emojiRepository,
        emojiStealerMessageRepository,
        guildRepository,
        memberRepository,
        messageRepository,
        userRepository,
    };
}

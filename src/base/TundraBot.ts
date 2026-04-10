import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { Pool } from "pg";

import type { createDbConnection } from "../db/db.ts";
import type { ChannelRepository } from "../db/repositories/ChannelRepository.ts";
import type { EmojiRepository } from "../db/repositories/EmojiRepository.ts";
import type { EmojiStealerMessageRepository } from "../db/repositories/EmojiStealerMessagesRepository.ts";
import type { GuildRepository } from "../db/repositories/GuildRepository.ts";
import type { MemberRepository } from "../db/repositories/MemberRepository.ts";
import type { MessageRepository } from "../db/repositories/MessageRepository.ts";
import type { UserRepository } from "../db/repositories/UserRepository.ts";
import { loadSlashCommands } from "../loaders/commands.ts";
import { loadRepositories } from "../loaders/db.ts";
import { loadEventHandlers } from "../loaders/events.ts";
import type { SlashCommand } from "./Command.ts";

export class TundraBot {
    client: Client;

    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        loadRepositories(this.client);

        this.client.slashCommands = new Collection();
        this.client.buttonInteractionHandlers = new Collection();
        loadSlashCommands(this.client);

        loadEventHandlers(this.client);
    }

    async login(token: string) {
        this.client.login(token);
    }
}

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>;
        /** Collection<customId, SlashCommand> */
        buttonInteractionHandlers: Collection<string, SlashCommand>;

        dbPool: Pool;
        db: ReturnType<typeof createDbConnection>;
        channelRepository: ChannelRepository;
        emojiRepository: EmojiRepository;
        emojiStealerMessageRepository: EmojiStealerMessageRepository;
        guildRepository: GuildRepository;
        memberRepository: MemberRepository;
        messageRepository: MessageRepository;
        userRepository: UserRepository;
    }
}

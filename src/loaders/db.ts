import type { Client } from "discord.js";

import { createDbConnection, createDbPool } from "../db/db.ts";
import { createRepositories } from "../db/utilities.ts";

export function loadRepositories(client: Client) {
    client.dbPool = createDbPool();
    client.db = createDbConnection(client.dbPool);

    const repos = createRepositories(client.db);
    client.channelRepository = repos.channelRepository;
    client.emojiRepository = repos.emojiRepository;
    client.emojiStealerMessageRepository = repos.emojiStealerMessageRepository;
    client.guildRepository = repos.guildRepository;
    client.memberRepository = repos.memberRepository;
    client.messageRepository = repos.messageRepository;
    client.userRepository = repos.userRepository;
}

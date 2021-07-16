import { Message } from "discord.js";
import { EventHandler } from "../base/EventHandler";
import { TundraBot } from "../base/TundraBot";
import { DBMessage } from "../models/Message";
import Deps from "../utils/deps";

export default class MessageDeleteHandler extends EventHandler {
    protected DBMessageManager: DBMessage;
    constructor(client: TundraBot) {
        super(client);
        this.DBMessageManager = Deps.get<DBMessage>(DBMessage);
    }

    async invoke(message: Message): Promise<void> {
        if (message.author.bot) return; // if a bot's message was deleted

        // If the message was not sent in a server
        if (!message.guild) return;

        // Update message in database
        this.DBMessageManager.update(message, null, { deleted: true });
    }
}
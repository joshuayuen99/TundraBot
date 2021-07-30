import { Message } from "discord.js";
import { EventHandler } from "../base/EventHandler";
import { TundraBot } from "../base/TundraBot";
import { DBMessage } from "../models/Message";
import Deps from "../utils/deps";

export default class MessageUpdateHandler extends EventHandler {
    protected DBMessageManager: DBMessage;
    constructor(client: TundraBot) {
        super(client);
        this.DBMessageManager = Deps.get<DBMessage>(DBMessage);
    }

    async invoke(oldMessage: Message, newMessage: Message): Promise<void> {
        if (oldMessage.author.bot) return; // if a bot's message was deleted

        // If the message was not sent in a server
        if (!oldMessage.guild) return;

        // Update message in database
        // Update message in database
        this.DBMessageManager.update(oldMessage, newMessage, null);
    }
}

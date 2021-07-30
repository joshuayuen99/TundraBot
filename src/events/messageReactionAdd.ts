import { MessageReaction, User } from "discord.js";
import { EventHandler } from "../base/EventHandler";
import { TundraBot } from "../base/TundraBot";
import Event from "../commands/utility/event";
import RoleMenu from "../commands/utility/rolemenu";
import Deps from "../utils/deps";

export default class MessageReactionAddHandler extends EventHandler {
    EventCommand: Event;
    RoleMenuCommand: RoleMenu;
    constructor(client: TundraBot) {
        super(client);
        this.EventCommand = Deps.get<Event>(Event);
        this.RoleMenuCommand = Deps.get<RoleMenu>(RoleMenu);
    }

    async invoke(reaction: MessageReaction, user: User): Promise<void> {
        if (this.client.databaseCache.events.has(reaction.message.id)) {
            this.EventCommand.eventHandleMessageReactionAdd(
                this.client,
                reaction,
                user
            );
        }

        if (this.client.databaseCache.roleMenus.has(reaction.message.id)) {
            this.RoleMenuCommand.roleMenuHandleMessageReactionAdd(
                this.client,
                reaction,
                user
            );
        }
    }
}

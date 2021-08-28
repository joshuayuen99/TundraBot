import { MessageReaction, User } from "discord.js";
import { EventHandler } from "../base/EventHandler";
import Event from "../commands/utility/event";
import RoleMenu from "../commands/utility/rolemenu";

export default class MessageReactionAddHandler extends EventHandler {
    async invoke(reaction: MessageReaction, user: User): Promise<void> {
        if (this.client.databaseCache.events.has(reaction.message.id)) {
            Event.eventHandleMessageReactionAdd(
                this.client,
                reaction,
                user
            );
        }

        if (this.client.databaseCache.roleMenus.has(reaction.message.id)) {
            RoleMenu.roleMenuHandleMessageReactionAdd(
                this.client,
                reaction,
                user
            );
        }
    }
}

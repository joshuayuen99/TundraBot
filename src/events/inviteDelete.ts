import { Invite } from "discord.js";
import { EventHandler } from "../base/EventHandler";

export default class InviteDeleteHandler extends EventHandler {
    async invoke(invite: Invite): Promise<void> {
        const currentInvites = this.client.guildInvites.get(invite.guild.id);
        if (!currentInvites) return; // we didn't cache any invites for this guild
        currentInvites.delete(invite[0]);
        this.client.guildInvites.set(invite.guild.id, currentInvites);
    }
}

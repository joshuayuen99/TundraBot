import { QueryType } from "discord-player";
import { VoiceState } from "discord.js";
import { EventHandler } from "../base/EventHandler";

export default class VoiceStateUpdateHandler extends EventHandler {
    async invoke(oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (!newState.guild.available) return;

        if (oldState.member.user.bot || newState.member.user.bot) return;

        if (oldState.channel && !newState.channel && oldState.channel.type === "GUILD_VOICE") {
            // Left channel
            const memberSoundEffects =
                this.client.databaseCache.memberSoundEffects.get(
                    `${oldState.guild.id}${oldState.member.id}`
                );
            if (memberSoundEffects && memberSoundEffects.leaveSoundEffect) {
                const searchResult = await this.client.player.search(memberSoundEffects.leaveSoundEffect.link, {
                    requestedBy: oldState.member.user,
                    searchEngine: QueryType.AUTO,
                });
        
                if (!searchResult || searchResult.tracks.length === 0) {
                    return;
                }

                const queue = this.client.player.createQueue(oldState.guild);
                try {
                    if (!queue.connection) await queue.connect(oldState.channel);
                } catch {
                    this.client.player.deleteQueue(oldState.guild.id);
                    return;
                }

                queue.addTrack(searchResult.tracks[0]);

                if (!queue.playing) await queue.play();
            }
        } else if (!oldState.channel && newState.channel && newState.channel.type === "GUILD_VOICE") {
            // Joined channel
            const memberSoundEffects =
                this.client.databaseCache.memberSoundEffects.get(
                    `${newState.guild.id}${newState.member.id}`
                );
            if (memberSoundEffects && memberSoundEffects.joinSoundEffect) {
                const searchResult = await this.client.player.search(memberSoundEffects.joinSoundEffect.link, {
                    requestedBy: newState.member.user,
                    searchEngine: QueryType.AUTO,
                });
        
                if (!searchResult || searchResult.tracks.length === 0) {
                    return;
                }

                const queue = this.client.player.createQueue(newState.guild);
                try {
                    if (!queue.connection) await queue.connect(newState.channel);
                } catch {
                    this.client.player.deleteQueue(newState.guild.id);
                    return;
                }

                queue.addTrack(searchResult.tracks[0]);

                if (!queue.playing) await queue.play();
            }
        }
    }
}

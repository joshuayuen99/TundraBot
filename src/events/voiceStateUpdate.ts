import { QueryType } from "discord-player";
import { VoiceState } from "discord.js";
import { EventHandler } from "../base/EventHandler";
import { TundraBot } from "../base/TundraBot";
import { DBMember } from "../models/Member";
import Deps from "../utils/deps";

export default class VoiceStateUpdateHandler extends EventHandler {
    DBMemberManager: DBMember;
    constructor(client: TundraBot) {
        super(client);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
    }

    async invoke(oldState: VoiceState, newState: VoiceState): Promise<void> {
        if (!newState.guild.available) return;

        if (oldState.member.user.bot || newState.member.user.bot) return;

        if (
            oldState.channel &&
            !newState.channel &&
            oldState.channel.type === "GUILD_VOICE"
        ) {
            // Left channel

            // Play sound effects
            const memberSoundEffects =
                this.client.databaseCache.memberSoundEffects.get(
                    `${oldState.guild.id}${oldState.member.id}`
                );
            if (memberSoundEffects && memberSoundEffects.leaveSoundEffect) {
                const searchResult = await this.client.player.search(
                    memberSoundEffects.leaveSoundEffect.link,
                    {
                        requestedBy: oldState.member.user,
                        searchEngine: QueryType.AUTO,
                    }
                );

                if (searchResult && searchResult.tracks.length > 0) {
                    const queue = this.client.player.createQueue(
                        oldState.guild
                    );
                    try {
                        if (!queue.connection)
                            await queue.connect(oldState.channel);

                        queue.addTrack(searchResult.tracks[0]);

                        if (!queue.playing) await queue.play();
                    } catch {
                        this.client.player.deleteQueue(oldState.guild.id);
                    }
                }
            }

            // Update voice activity in database
            const savedMember = await this.DBMemberManager.get(newState.member);

            const dateNow = new Date(Date.now());

            savedMember.voiceActivity.leaveTime = dateNow;

            if (savedMember.voiceActivity.joinTime) {
                savedMember.voiceActivity.voiceDuration +=
                    savedMember.voiceActivity.leaveTime.getTime() -
                    savedMember.voiceActivity.joinTime.getTime();
            }

            // Check if they were streaming
            if (oldState.streaming) {
                savedMember.voiceActivity.streamEndTime = dateNow;

                if (savedMember.voiceActivity.streamStartTime) {
                    savedMember.voiceActivity.streamDuration +=
                        savedMember.voiceActivity.streamEndTime.getTime() -
                        savedMember.voiceActivity.streamStartTime.getTime();
                }
            }

            this.DBMemberManager.save(savedMember);
        } else if (
            !oldState.channel &&
            newState.channel &&
            newState.channel.type === "GUILD_VOICE"
        ) {
            // Joined channel

            // Play sound effects
            const memberSoundEffects =
                this.client.databaseCache.memberSoundEffects.get(
                    `${newState.guild.id}${newState.member.id}`
                );
            if (memberSoundEffects && memberSoundEffects.joinSoundEffect) {
                const searchResult = await this.client.player.search(
                    memberSoundEffects.joinSoundEffect.link,
                    {
                        requestedBy: newState.member.user,
                        searchEngine: QueryType.AUTO,
                    }
                );

                if (searchResult && searchResult.tracks.length > 0) {
                    const queue = this.client.player.createQueue(
                        newState.guild
                    );
                    try {
                        if (!queue.connection)
                            await queue.connect(newState.channel);

                        queue.addTrack(searchResult.tracks[0]);

                        if (!queue.playing) await queue.play();
                    } catch {
                        this.client.player.deleteQueue(newState.guild.id);
                    }
                }
            }

            // Update voice activity in database
            const savedMember = await this.DBMemberManager.get(newState.member);

            const dateNow = new Date(Date.now());

            savedMember.voiceActivity.joinTime = dateNow;

            this.DBMemberManager.save(savedMember);
        } else if (!oldState.streaming && newState.streaming) {
            // Started streaming

            // Update voice activity in database
            const savedMember = await this.DBMemberManager.get(newState.member);

            const dateNow = new Date(Date.now());

            savedMember.voiceActivity.streamStartTime = dateNow;

            this.DBMemberManager.save(savedMember);
        } else if (oldState.streaming && !newState.streaming) {
            // Stopped streaming

            // Update voice activity in database
            const savedMember = await this.DBMemberManager.get(newState.member);

            const dateNow = new Date(Date.now());

            savedMember.voiceActivity.streamEndTime = dateNow;

            if (savedMember.voiceActivity.streamStartTime) {
                savedMember.voiceActivity.streamDuration +=
                    savedMember.voiceActivity.streamEndTime.getTime() -
                    savedMember.voiceActivity.streamStartTime.getTime();
            }

            this.DBMemberManager.save(savedMember);
        }
    }
}

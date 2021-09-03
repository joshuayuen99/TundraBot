/* eslint-disable @typescript-eslint/no-unused-vars */
import { GuildMember, VoiceChannel } from "discord.js";
import { TundraBot } from "../base/TundraBot";
import { DBMember } from "../models/Member";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class CheckVoiceActivities extends StartupHelper {
    DBMemberManager: DBMember;
    constructor(client: TundraBot) {
        super(client);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
    }

    async init(): Promise<void> {
        let resolvedMembersCount = 0;
        const voiceMembers: GuildMember[] = [];
        for (const [guildID, guild] of this.client.guilds.cache) {
            for (const [channelID, channel] of guild.channels.cache.filter(
                (channel) =>
                    channel.type === "GUILD_VOICE" ||
                    channel.type === "GUILD_STAGE_VOICE"
            )) {
                for (const [memberID, member] of (<VoiceChannel>channel)
                    .members) {
                    voiceMembers.push(member);
                }
            }
        }

        Logger.log(
            "ready",
            `Currently ${voiceMembers.length} members in voice channels`
        );

        await Promise.all(
            voiceMembers.map(async (member) => {
                await this.DBMemberManager.get(member).then(async (savedMember) => {
                    const dateNow = new Date(Date.now());

                    savedMember.voiceActivity.joinTime = dateNow;

                    // Check if member is streaming
                    if (member.voice.streaming) {
                        savedMember.voiceActivity.streamStartTime = dateNow;
                    }

                    await this.DBMemberManager.save(savedMember).then(() => {
                        resolvedMembersCount++;
                    });
                });
            })
        );

        Logger.log(
            "ready",
            `Successfully updated ${resolvedMembersCount} members' voice states`
        );
    }

    async shutdown(): Promise<void> {
        let resolvedMembersCount = 0;
        const voiceMembers: GuildMember[] = [];
        for (const [guildID, guild] of this.client.guilds.cache) {
            for (const [channelID, channel] of guild.channels.cache.filter(
                (channel) =>
                    channel.type === "GUILD_VOICE" ||
                    channel.type === "GUILD_STAGE_VOICE"
            )) {
                for (const [memberID, member] of (<VoiceChannel>channel)
                    .members) {
                    voiceMembers.push(member);
                }
            }
        }

        Logger.log(
            "info",
            `Currently ${voiceMembers.length} in voice channels`
        );

        await Promise.all(
            voiceMembers.map(async (member) => {
                await this.DBMemberManager.get(member).then(
                    async (savedMember) => {
                        const dateNow = new Date(Date.now());

                        savedMember.voiceActivity.leaveTime = dateNow;

                        // Sum up member's current voice time
                        if (savedMember.voiceActivity.joinTime) {
                            savedMember.voiceActivity.voiceDuration +=
                                savedMember.voiceActivity.leaveTime.getTime() -
                                savedMember.voiceActivity.joinTime.getTime();
                        }

                        // Check if they were streaming
                        if (member.voice.streaming) {
                            savedMember.voiceActivity.streamEndTime = dateNow;

                            if (savedMember.voiceActivity.streamStartTime) {
                                savedMember.voiceActivity.streamDuration +=
                                    savedMember.voiceActivity.streamEndTime.getTime() -
                                    savedMember.voiceActivity.streamStartTime.getTime();
                            }
                        }

                        await this.DBMemberManager.save(savedMember).then(
                            () => {
                                resolvedMembersCount++;
                            }
                        );
                    }
                );
            })
        );

        Logger.log(
            "info",
            `Successfully updated ${resolvedMembersCount} member voice states`
        );
    }
}

import { GuildMember } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";
import { soundEffectInterface } from "./SoundEffect";

export interface memberSettings {
    joinSoundEffect: Schema.Types.ObjectId;
    leaveSoundEffect: Schema.Types.ObjectId;
}

export interface memberInterface extends Document {
    userID: string;
    guildID: string;
    username: string;
    settings: memberSettings;
    ban: {
        endTime: Date;
    };
    mute: {
        endTime: Date;
    };
}

const memberSchema = new Schema<memberInterface>({
    userID: String,
    guildID: String,
    username: String,
    settings: {
        joinSoundEffect: {
            type: Schema.Types.ObjectId,
            ref: "SoundEffect",
            default: null,
        },
        leaveSoundEffect: {
            type: Schema.Types.ObjectId,
            ref: "SoundEffect",
            default: null,
        },
    },
    ban: {
        endTime: { type: Date, default: null },
    },
    mute: {
        endTime: { type: Date, default: null },
    },
});

export const memberModel = model<memberInterface>("Member", memberSchema);

export class DBMember extends DBWrapper<GuildMember, memberInterface> {
    protected async getOrCreate(member: GuildMember): Promise<memberInterface> {
        const savedMember = await memberModel.findOne({
            userID: member.user.id,
            guildID: member.guild.id,
        });

        return savedMember ?? this.create(member);
    }
    async create(member: GuildMember): Promise<memberInterface> {
        const newMember = await new memberModel({
            userID: member.user.id,
            guildID: member.guild.id,
            username: member.user.username,
        });

        return this.save(newMember).catch(() => {
            throw new Error("Error creating new member in database");
        });
    }

    async update(
        member: GuildMember,
        settings: memberSettings
    ): Promise<memberInterface> {
        const savedMember = await this.get(member);
        const memberSettings = savedMember.settings;

        for (const key in settings) {
            if (memberSettings[key] !== settings[key])
                memberSettings[key] = settings[key];
            else continue;
        }

        return memberModel
            .findOneAndUpdate(
                {
                    userID: member.user.id,
                    guildID: member.guild.id,
                },
                {
                    settings: memberSettings,
                },
                { new: true }
            )
            .catch(() => {
                throw new Error("Error updating user settings in database");
            });
    }

    async updateJoinEffect(
        member: GuildMember,
        soundEffect: soundEffectInterface
    ): Promise<void> {
        const savedMember = await this.get(member);
        savedMember.settings.joinSoundEffect = soundEffect?._id ?? null;

        let memberSoundEffects =
            this.client.databaseCache.memberSoundEffects.get(
                `${member.guild.id}${member.user.id}`
            );

        // not in cache yet
        if (!memberSoundEffects) {
            memberSoundEffects = {
                joinSoundEffect: soundEffect,
                leaveSoundEffect: null,
            };
        } else {
            memberSoundEffects.joinSoundEffect = soundEffect;
        }

        await this.save(savedMember).then(() => {
            this.client.databaseCache.memberSoundEffects.set(
                `${member.guild.id}${member.user.id}`,
                memberSoundEffects
            );
        });
    }

    async updateLeaveEffect(
        member: GuildMember,
        soundEffect: soundEffectInterface
    ): Promise<void> {
        const savedMember = await this.get(member);
        savedMember.settings.leaveSoundEffect = soundEffect?._id || null;

        let memberSoundEffects =
            this.client.databaseCache.memberSoundEffects.get(
                `${member.guild.id}${member.user.id}`
            );

        // not in cache yet
        if (!memberSoundEffects) {
            memberSoundEffects = {
                joinSoundEffect: null,
                leaveSoundEffect: soundEffect,
            };
        } else {
            memberSoundEffects.leaveSoundEffect = soundEffect;
        }

        await this.save(savedMember).then(() => {
            this.client.databaseCache.memberSoundEffects.set(
                `${member.guild.id}${member.user.id}`,
                memberSoundEffects
            );
        });
    }

    async mute(member: GuildMember, endTime: Date): Promise<memberInterface> {
        return memberModel.findOneAndUpdate(
            { userID: member.user.id, guildID: member.guild.id },
            { "mute.endTime": endTime },
            { upsert: true }
        );
    }

    async unmute(member: GuildMember): Promise<memberInterface> {
        return memberModel.findOneAndUpdate(
            { userID: member.user.id, guildID: member.guild.id },
            { "mute.endTime": null }
        );
    }

    async ban(member: GuildMember, endTime: Date): Promise<memberInterface> {
        return memberModel.findOneAndUpdate(
            { userID: member.user.id, guildID: member.guild.id },
            { "ban.endTime": endTime },
            { upsert: true }
        );
    }

    async unban(userID: string, guildID: string): Promise<memberInterface> {
        return memberModel.findOneAndUpdate(
            { userID: userID, guildID: guildID },
            { "ban.endTime": null }
        );
    }
}

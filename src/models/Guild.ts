import { Guild } from "discord.js";
import { Document, model, Schema } from "mongoose";
import defaults from "../config";
import DBWrapper from "./db-wrapper";
import CacheInvites from "../helpers/cacheInvites";
import Logger from "../utils/logger";

export interface guildInterface extends Document {
    guildID: string;
    guildName: string;
    timeJoined: Date;
    prefix: string;
    welcomeMessage: {
        enabled: boolean;
        welcomeMessage: string;
        channelID: string;
    };
    joinMessages: {
        enabled: boolean;
        channelID: string;
        trackInvites: boolean;
    };
    leaveMessages: {
        enabled: boolean;
        channelID: string;
    };
    soundboardRoleID: string;
    modRole: string;
    adminRole: string;
    logMessages: {
        enabled: boolean;
        channelID: string;
    };
    blacklistedChannelIDs: string[];
}

const guildSchema = new Schema<guildInterface>({
    guildID: {
        type: String,
        unique: true,
    },
    guildName: String,
    timeJoined: Date,
    prefix: {
        type: String,
        default: process.env.COMMAND_PREFIX,
    },
    welcomeMessage: {
        enabled: { type: Boolean, default: false },
        welcomeMessage: {
            type: String,
            default:
                defaults.defaultGuildSettings.welcomeMessage.welcomeMessage,
        },
        channelID: { type: String, default: null },
    },
    joinMessages: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, default: null },
        trackInvites: { type: Boolean, default: true },
    },
    leaveMessages: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, default: null },
    },
    soundboardRoleID: {
        type: String,
        default: null,
    },
    modRole: {
        type: String,
        default: defaults.defaultGuildSettings.modRole,
    },
    adminRole: {
        type: String,
        default: defaults.defaultGuildSettings.adminRole,
    },
    logMessages: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, default: null },
    },
    blacklistedChannelIDs: [{ type: String }],
});

export const guildModel = model<guildInterface>("Guild", guildSchema);

export class DBGuild extends DBWrapper<Guild, guildInterface> {
    protected async getOrCreate(guild: Guild): Promise<guildInterface> {
        // Check cache first
        if (this.client.databaseCache.settings.has(guild.id))
            return this.client.databaseCache.settings.get(guild.id);

        const savedGuild = await guildModel.findOne({
            guildID: guild.id,
        });

        // Update cache
        this.client.databaseCache.settings.set(guild.id, savedGuild);

        return savedGuild ?? this.create(guild);
    }

    async create(guild: Guild): Promise<guildInterface> {
        const clientMember = await guild.members.fetch(this.client.user.id);

        const guildInfo = {
            guildID: guild.id,
            guildName: guild.name,
            timeJoined: clientMember.joinedAt,
        } as Partial<guildInterface>;

        const defaultGuildSettings = Object.assign(
            defaults.defaultGuildSettings
        ) as Partial<guildInterface>;
        const mergedGuildSettings = Object.assign(
            defaultGuildSettings,
            guildInfo
        ) as guildInterface;
        const newGuild = await new guildModel(mergedGuildSettings).save();

        Logger.log(
            "info",
            `Default settings saved for guild "${mergedGuildSettings.guildName}" (${mergedGuildSettings.guildID})`
        );

        // Update cache
        this.client.databaseCache.settings.set(guild.id, newGuild);

        return newGuild;
    }

    async update(
        guild: Guild,
        settings: Partial<guildInterface>
    ): Promise<guildInterface> {
        const data = await this.getOrCreate(guild);

        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else continue;
        }

        const updatedGuild = await guildModel.findOneAndUpdate(
            { guildID: guild.id },
            data,
            { new: true }
        );

        Logger.log(
            "info",
            `Guild "${updatedGuild.guildName}" updated settings: ${Object.keys(
                settings
            ).join(", ")}`
        );

        // Update cache
        this.client.databaseCache.settings.set(guild.id, updatedGuild);

        // Cache invites if they just enabled them
        if (updatedGuild.joinMessages.trackInvites)
            CacheInvites.cacheInvites(this.client, guild);

        return updatedGuild;
    }

    async delete(guild: Guild): Promise<void> {
        await guildModel.findOneAndDelete({ guildID: guild.id }).then(() => {
            // Delete from cache
            this.client.databaseCache.settings.delete(guild.id);
        });
        return;
    }
}

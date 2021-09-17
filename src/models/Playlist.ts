import { Track } from "discord-player";
import { Guild, Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";
import { guildInterface } from "./Guild";

export interface playlistInterface extends Document {
    name: string;
    guildID: Snowflake;
    tracks: Track[];
    filters: string[];

    createdAt: Date;
    updatedAt: Date;
}

const playlistSchema = new Schema<playlistInterface>(
    {
        name: String,
        guildID: String,
        tracks: Schema.Types.Mixed,
        filters: [{ type: String }],
    },
    { timestamps: true }
);

export const playlistModel = model<playlistInterface>(
    "Playlist",
    playlistSchema
);

export class DBPlaylist extends DBWrapper<
    Partial<playlistInterface>,
    playlistInterface
> {
    protected async getOrCreate(
        playlist: Partial<playlistInterface>
    ): Promise<playlistInterface> {
        const savedPlaylist = await playlistModel.findOne({
            name: playlist.name,
            guildID: playlist.guildID,
        });

        return savedPlaylist ?? this.create(playlist);
    }

    create(playlist: Partial<playlistInterface>): Promise<playlistInterface> {
        throw new Error("Method not implemented.");
    }

    async getGuildPlaylists(guild: Guild): Promise<playlistInterface[]> {
        const savedPlaylists = await playlistModel.find({ guildID: guild.id });

        return savedPlaylists;
    }
}

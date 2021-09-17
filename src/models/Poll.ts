import { Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface pollInterface extends Document {
    messageID: Snowflake;
    guildID: Snowflake;
    channelID: Snowflake;
    pollQuestion: string;
    emojisList: string[];
    creatorID: Snowflake;
    startTime: Date;
    endTime: Date;

    createdAt: Date;
    updatedAt: Date;
}

const pollSchema = new Schema<pollInterface>(
    {
        messageID: String,
        guildID: String,
        channelID: String,
        pollQuestion: String,
        emojisList: [{ type: String }],
        creatorID: String,
        startTime: Date,
        endTime: Date,
    },
    { timestamps: true }
);

export const pollModel = model<pollInterface>("Poll", pollSchema);

export class DBPoll extends DBWrapper<Partial<pollInterface>, pollInterface> {
    protected async getOrCreate(
        poll: Partial<pollInterface>
    ): Promise<pollInterface> {
        const savedPoll = await pollModel.findOne({
            messageID: poll.messageID,
        });

        return savedPoll ?? this.create(poll);
    }
    async create(poll: Partial<pollInterface>): Promise<pollInterface> {
        const newPoll = new pollModel(poll);

        return newPoll.save();
    }

    async delete(poll: pollInterface): Promise<void> {
        await pollModel.findOneAndDelete({ messageID: poll.messageID });
        return;
    }
}

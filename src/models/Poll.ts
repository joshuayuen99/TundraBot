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
}

const pollSchema = new Schema<pollInterface>({
    messageID: String,
    guildID: String,
    channelID: String,
    pollQuestion: String,
    emojisList: [{ type: String }],
    creatorID: String,
    startTime: Date,
    endTime: Date,
});

export const pollModel = model<pollInterface>("Poll", pollSchema);

export class DBPoll extends DBWrapper<Partial<pollInterface>, pollInterface> {
    protected async getOrCreate (poll: Partial<pollInterface>): Promise<pollInterface> {
        const savedPoll = await pollModel.findOne({ messageID: poll.messageID }).catch(() => {
            throw new Error("Error finding poll in database");
        });

        return savedPoll ?? this.create(poll);
    }
    async create (poll: Partial<pollInterface>): Promise<pollInterface> {
        const newPoll = await new pollModel(poll);

        return newPoll.save().catch(() => {
            throw new Error("Error saving new poll in database");
        });
    }

    async delete(poll: pollInterface): Promise<void> {
        await pollModel.findOneAndDelete({ messageID: poll.messageID });
        return;
    }
}
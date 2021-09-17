import { Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface eventInterface extends Document {
    messageID: Snowflake;
    guildID: Snowflake;
    channelID: Snowflake;
    event: string;
    maxParticipants: number;
    participants: Snowflake[];
    creatorID: Snowflake;
    startTime: Date;
    endTime: Date;

    createdAt: Date;
    updatedAt: Date;
}

const eventSchema = new Schema<eventInterface>(
    {
        messageID: String,
        guildID: String,
        channelID: String,
        event: String,
        maxParticipants: { type: Number, default: 0 },
        participants: [{ type: String }],
        creatorID: String,
        startTime: Date,
        endTime: Date,
    },
    { timestamps: true }
);

export const eventModel = model<eventInterface>("Event", eventSchema);

export class DBEvent extends DBWrapper<
    Partial<eventInterface>,
    eventInterface
> {
    protected async getOrCreate(
        event: Partial<eventInterface>
    ): Promise<eventInterface> {
        // Check cache first
        if (this.client.databaseCache.events.has(event.messageID))
            return this.client.databaseCache.events.get(event.messageID);

        const savedEvent = await eventModel.findOne({
            messageID: event.messageID,
        });

        // Update cache
        this.client.databaseCache.events.set(event.messageID, savedEvent);

        return savedEvent ?? this.create(event);
    }

    async create(event: Partial<eventInterface>): Promise<eventInterface> {
        return new eventModel(event).save().then((newEvent) => {
            // Update cache
            this.client.databaseCache.events.set(event.messageID, newEvent);

            return newEvent;
        });
    }

    async delete(event: eventInterface): Promise<void> {
        await eventModel
            .findOneAndDelete({ messageID: event.messageID })
            .then(() => {
                this.client.databaseCache.events.delete(event.messageID);
            });
        return;
    }

    async addParticipant(
        event: Partial<eventInterface>,
        participant: string
    ): Promise<eventInterface> {
        return await eventModel
            .findOneAndUpdate(
                { messageID: event.messageID },
                {
                    $addToSet: {
                        participants: participant,
                    },
                },
                { new: true }
            )
            .then((updatedEvent) => {
                // Update cache
                this.client.databaseCache.events.set(
                    event.messageID,
                    updatedEvent
                );

                return updatedEvent;
            });
    }

    async removeParticipant(
        event: Partial<eventInterface>,
        participant: string
    ): Promise<eventInterface> {
        return await eventModel
            .findOneAndUpdate(
                {
                    messageID: event.messageID,
                },
                {
                    $pull: { participants: participant },
                },
                { new: true }
            )
            .then((updatedEvent) => {
                // Update cache
                this.client.databaseCache.events.set(
                    event.messageID,
                    updatedEvent
                );

                return updatedEvent;
            });
    }
}

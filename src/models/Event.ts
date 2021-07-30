import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface eventInterface extends Document {
    messageID: string;
    guildID: string;
    channelID: string;
    event: string;
    maxParticipants: number;
    participants: string[];
    creatorID: string;
    startTime: Date;
    endTime: Date;
}

const eventSchema = new Schema<eventInterface>({
    messageID: String,
    guildID: String,
    channelID: String,
    event: String,
    maxParticipants: { type: Number, default: 0 },
    participants: [{ type: String }],
    creatorID: String,
    startTime: Date,
    endTime: Date,
});

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

        const savedEvent = await eventModel
            .findOne({ messageID: event.messageID })
            .catch(() => {
                throw new Error("Error finding event in database");
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
            ).then((updatedEvent) => {
                // Update cache
                this.client.databaseCache.events.set(event.messageID, updatedEvent);

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
            ).then((updatedEvent) => {
                // Update cache
                this.client.databaseCache.events.set(event.messageID, updatedEvent);

                return updatedEvent;
            });
    }
}

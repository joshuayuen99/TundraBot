import { Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface reminderInterface extends Document {
    userID: Snowflake;
    reminder: string;
    startTime: Date;
    endTime: Date;

    createdAt: Date;
    updatedAt: Date;
}

const reminderSchema = new Schema<reminderInterface>(
    {
        userID: String,
        reminder: String,
        startTime: Date,
        endTime: Date,
    },
    { timestamps: true }
);

export const reminderModel = model<reminderInterface>(
    "Reminder",
    reminderSchema
);

export class DBReminder extends DBWrapper<
    Partial<reminderInterface>,
    reminderInterface
> {
    protected getOrCreate(
        reminder: Partial<reminderInterface>
    ): Promise<reminderInterface> {
        throw new Error("Method not implemented.");
    }

    async create(
        reminder: Partial<reminderInterface>
    ): Promise<reminderInterface> {
        const newReminder = await new reminderModel(reminder);

        return newReminder.save();
    }

    async delete(reminder: reminderInterface): Promise<void> {
        await reminderModel.findOneAndDelete({
            userID: reminder.userID,
            reminder: reminder.reminder,
            startTime: reminder.startTime,
            endTime: reminder.endTime,
        });
        return;
    }

    async getUsersReminders(userID: string): Promise<reminderInterface[]> {
        return reminderModel.find({ userID: userID });
    }
}

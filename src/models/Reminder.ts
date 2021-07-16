import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface reminderInterface extends Document {
    userID: string;
    reminder: string;
    startTime: Date;
    endTime: Date;
}

const reminderSchema = new Schema<reminderInterface>({
    userID: String,
    reminder: String,
    startTime: Date,
    endTime: Date,
});

export const reminderModel = model("Reminder", reminderSchema);

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
        reminderModel
            .findOneAndDelete({
                userID: reminder.userID,
                reminder: reminder.reminder,
                startTime: reminder.startTime,
                endTime: reminder.endTime,
            });
        return;
    }

    async getUsersReminders(userID: string): Promise<reminderInterface[]> {
        return reminderModel.find({ userID: userID }).catch(() => {
            throw new Error(
                `Error getting user's reminders (userID: ${userID})`
            );
        });
    }
}

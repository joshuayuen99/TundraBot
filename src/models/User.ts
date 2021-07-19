import { User } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface userSettings {
    timezone: string;
}

export interface userInterface extends Document {
    userID: string;
    username: string;
    settings: userSettings;
}

const userSchema = new Schema<userInterface>({
    userID: {
        type: String,
        unique: true,
    },
    username: String,
    settings: {
        timezone: { type: String, default: null },
    },
});

export const userModel = model("User", userSchema);

export class DBUser extends DBWrapper<User, userInterface> {
    protected async getOrCreate(user: User): Promise<userInterface> {
        const savedUser = await userModel
            .findOne({ userID: user.id })
            .catch(() => {
                throw new Error("Error finding user in database");
            });

        return savedUser ?? this.create(user);
    }

    async create(user: User): Promise<userInterface> {
        const newUser = await new userModel({
            userID: user.id,
            username: user.username,
            settings: {
                timezone: null,
            },
        });

        return this.save(newUser);
    }

    async update(user: User, settings: Partial<userSettings>): Promise<userInterface> {
        const savedUser = await this.get(user);
        const userSettings = savedUser.settings;

        for (const key in settings) {
            if (userSettings[key] !== settings[key]) userSettings[key] = settings[key];
            else continue;
        }

        return userModel.findOneAndUpdate({ userID: user.id }, {
            settings: userSettings
        }, { new: true });
    }
}

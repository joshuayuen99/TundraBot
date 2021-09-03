import { Message, Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import { TundraBot } from "../base/TundraBot";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import DBWrapper from "./db-wrapper";
import { DBGuild } from "./Guild";

export interface messageInterface extends Document {
    messageID: Snowflake;
    text: string;
    editedText: string[];
    attachments: string[];
    command: string;
    userID: Snowflake;
    guildID: Snowflake;
    channelID: Snowflake;
    deleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<messageInterface>(
    {
        messageID: {
            type: String,
            unique: true,
        },
        text: { type: String },
        editedText: [{ type: String }],
        attachments: [{ type: String }],
        command: String,
        userID: String,
        username: String,
        guildID: String,
        channelID: String,
        deleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

export const messageModel = model<messageInterface>("Message", messageSchema);

export class DBMessage extends DBWrapper<Message, messageInterface> {
    protected DBGuildManager: DBGuild;

    constructor(client: TundraBot) {
        super(client);

        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    protected async getOrCreate(message: Message): Promise<messageInterface> {
        const savedMessage = await messageModel
            .findOne({
                messageID: message.id,
            })
            .catch(() => {
                throw new Error("Error finding message in database");
            });

        return savedMessage ?? this.create(message);
    }

    async create(message: Message): Promise<messageInterface> {
        const settings = await this.DBGuildManager.get(message.guild);

        let command;
        if (message.content.startsWith(settings.prefix)) {
            const commandString = message.content
                .split(" ")[0]
                .slice(settings.prefix.length)
                .toLowerCase();
            if (commandString.length === 0) command = "";
            else {
                let commandFunction = this.client.commands.get(commandString);
                if (!commandFunction)
                    commandFunction = this.client.commands.get(
                        this.client.aliases.get(commandString)
                    );

                if (commandFunction) command = commandString;
                else command = "";
            }
        } else {
            command = "";
        }

        const attachments = message.attachments.map((attachment) => attachment.url);

        const newMessage = new messageModel({
            messageID: message.id,
            text: message.content,
            command: command,
            attachments: attachments,
            userID: message.author.id,
            username: message.author.username,
            guildID: message.guild.id,
            channelID: message.channel.id,
        });

        return this.save(newMessage).catch((err) => {
            Logger.log("error", err);
            throw new Error("Error saving new message to database");
        });
    }

    // TODO: separate into two different functions
    async update(
        message: Message,
        newMessage: Message,
        settings: Partial<messageInterface>
    ): Promise<messageInterface> {
        // The message was edited (check to make sure it wasn't just an embed being added onto the message)
        if (newMessage && message.content != newMessage.content) {
            return await messageModel
                .findOneAndUpdate(
                    { messageID: message.id },
                    {
                        $push: { editedText: newMessage.content },
                    }
                )
                .catch(() => {
                    throw new Error(
                        "Error updating edited message in database"
                    );
                });
        }

        // Change message attributes (deleted)
        const data = await this.get(message);

        for (const key in settings) {
            if (data[key] !== settings[key]) data[key] = settings[key];
            else continue;
        }

        return await messageModel
            .findOneAndUpdate(
                {
                    messageID: message.id,
                },
                data,
                { new: true }
            )
            .catch(() => {
                throw new Error("Error updating message in database");
            });
    }
}

import { Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface RoleOption {
    emoji: string;
    roleID: Snowflake;
}

export interface roleMenuInterface extends Document {
    messageID: string;
    guildID: string;
    channelID: string;
    roleMenuTitle: string;
    roleOptions: RoleOption[];

    createdAt: Date;
    updatedAt: Date;
}

const roleMenuSchema = new Schema<roleMenuInterface>(
    {
        messageID: String,
        guildID: String,
        channelID: String,
        roleMenuTitle: String,
        roleOptions: [
            {
                emoji: { type: String },
                roleID: { type: String },
            },
        ],
    },
    { timestamps: true }
);

export const roleMenuModel = model<roleMenuInterface>(
    "RoleMenu",
    roleMenuSchema
);

export class DBRoleMenu extends DBWrapper<
    Partial<roleMenuInterface>,
    roleMenuInterface
> {
    protected async getOrCreate(
        roleMenu: Partial<roleMenuInterface>
    ): Promise<roleMenuInterface> {
        // Check cache first
        if (this.client.databaseCache.roleMenus.has(roleMenu.messageID)) {
            return this.client.databaseCache.roleMenus.get(roleMenu.messageID);
        }

        const savedRoleMenu = await roleMenuModel.findOne({
            messageID: roleMenu.messageID,
        });

        // Update cache
        this.client.databaseCache.roleMenus.set(
            roleMenu.messageID,
            savedRoleMenu
        );

        return savedRoleMenu ?? this.create(roleMenu);
    }
    async create(
        roleMenu: Partial<roleMenuInterface>
    ): Promise<roleMenuInterface> {
        const newRoleMenu = new roleMenuModel(roleMenu);

        // Update cache
        this.client.databaseCache.roleMenus.set(
            roleMenu.messageID,
            newRoleMenu
        );

        return newRoleMenu.save();
    }

    async update(
        messageID: string,
        roleMenu: Partial<roleMenuInterface>
    ): Promise<roleMenuInterface> {
        return roleMenuModel
            .findOneAndUpdate({ messageID: messageID }, roleMenu, { new: true })
            .then((updatedRoleMenu) => {
                // Update cache
                this.client.databaseCache.roleMenus.set(
                    roleMenu.messageID,
                    updatedRoleMenu
                );

                return updatedRoleMenu;
            });
    }

    async delete(messageID: string): Promise<void> {
        await roleMenuModel
            .findOneAndDelete({ messageID: messageID })
            .then(() => {
                // Delete from cache
                this.client.databaseCache.roleMenus.delete(messageID);
            });
        return;
    }
}

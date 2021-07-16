import { Document, model, Schema } from "mongoose";
import DBWrapper from "./db-wrapper";

export interface RoleOption {
    emoji: string;
    roleID: string;
}

export interface roleMenuInterface extends Document {
    messageID: string;
    guildID: string;
    channelID: string;
    roleMenuTitle: string;
    roleOptions: RoleOption[];
}

const roleMenuSchema = new Schema<roleMenuInterface>({
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
});

export const roleMenuModel = model("RoleMenu", roleMenuSchema);

export class DBRoleMenu extends DBWrapper<Partial<roleMenuInterface>, roleMenuInterface> {
    protected async getOrCreate (roleMenu: Partial<roleMenuInterface>): Promise<roleMenuInterface> {
        // Check cache first
        if (this.client.databaseCache.roleMenus.has(roleMenu.messageID)) {
            return this.client.databaseCache.roleMenus.get(roleMenu.messageID);
        }

        const savedRoleMenu = await roleMenuModel.findOne({ messageID: roleMenu.messageID}).catch(() => {
            throw new Error("Error finding rolemenu in database");
        });

        // Update cache
        this.client.databaseCache.roleMenus.set(roleMenu.messageID, savedRoleMenu);

        return savedRoleMenu ?? this.create(roleMenu);
    }
    async create (roleMenu: Partial<roleMenuInterface>): Promise<roleMenuInterface> {
        const newRoleMenu = await new roleMenuModel(roleMenu);

        // Update cache
        this.client.databaseCache.roleMenus.set(roleMenu.messageID, newRoleMenu);

        return newRoleMenu.save().catch(() => {
            throw new Error("Error creating new role menu in database");
        });
    }

    async update (messageID: string, roleMenu: Partial<roleMenuInterface>): Promise<roleMenuInterface> {
        const updatedRoleMenu = await roleMenuModel.findOneAndUpdate({ messageID: messageID }, roleMenu, { new: true }).catch(() => {
            throw new Error(`Error updating role menu (messageID: ${roleMenu.messageID}) in database`);
        });

        // Update cache
        this.client.databaseCache.roleMenus.set(roleMenu.messageID, updatedRoleMenu);

        return updatedRoleMenu;
    }

    async delete (messageID: string): Promise<void> {
        roleMenuModel.findOneAndDelete({ messageID: messageID });

        // Delete from cache
        this.client.databaseCache.roleMenus.delete(messageID);
    }
}
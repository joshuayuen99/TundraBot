import { TextChannel } from "discord.js";
import { TundraBot } from "../base/TundraBot";
import { DBRoleMenu, roleMenuModel } from "../models/RoleMenu";
import Deps from "../utils/deps";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class LoadRoleMenus extends StartupHelper {
    DBRolemenuManager: DBRoleMenu;
    constructor(client: TundraBot) {
        super(client);
        this.DBRolemenuManager = Deps.get<DBRoleMenu>(DBRoleMenu);
    }

    async init(): Promise<void> {
        roleMenuModel
            .find()
            .then(async (roleMenus) => {
                for (const roleMenu of roleMenus) {
                    try {
                        // Fetch role menu message if not cached already
                        if (!this.client.guilds.cache.has(roleMenu.guildID)) {
                            throw new Error(
                                `Guild was deleted (${roleMenu.guildID})`
                            );
                        }
                        const channel = await this.client.channels
                            .fetch(roleMenu.channelID)
                            .catch(() => {
                                throw new Error(
                                    `Channel was deleted (${roleMenu.channelID})`
                                );
                            }) as TextChannel;
                        await channel.messages
                            .fetch(roleMenu.messageID)
                            .catch(() => {
                                throw new Error(
                                    "Rolemenu message was deleted manually"
                                );
                            });

                        // load into databaseCache
                        this.client.databaseCache.roleMenus.set(
                            roleMenu.messageID,
                            roleMenu
                        );
                    } catch (err) {
                        // remove role menu from database
                        this.DBRolemenuManager.delete(roleMenu.messageID).catch(
                            () => {
                                Logger.log(
                                    "error",
                                    `Couldn't delete role menu from database:\n${err}`
                                );
                            }
                        );
                    }
                }
                Logger.log("ready", `Loaded ${roleMenus.length} rolemenus`);
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error loading rolemenus in LoadRoleMenus:\n${err}`
                );
            });
    }
}

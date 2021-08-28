import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

import { registerInteractiveCommands } from "../../handlers/commands";
import Logger from "../../utils/logger";

export default class Deploy implements Command {
    name = "deploy";
    category = "owner";
    description = "Deploy interactive commands globally.";
    usage = "deploy";
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = false;
    cooldown = 0; // 0 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        registerInteractiveCommands(ctx.client).then(() => {
            Logger.log("ready", `Loaded ${ctx.client.interactiveCommands.size} interative commands`);

            sendReply(ctx.client, `✅ Successfully loaded ${ctx.client.interactiveCommands.size} interactive commands`, ctx.msg);
            return;
        }).catch((err) => {
            Logger.log("error", `Error globally loading interactive commands:\n${err}`);

            sendReply(ctx.client, "❌ Error globally loading interactive commands", ctx.msg);
            return;
        });
    }
}

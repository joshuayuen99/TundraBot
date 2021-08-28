import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

import { unloadCommand } from "../../handlers/commands";

export default class Unload implements Command {
    name = "unload";
    category = "owner";
    description = "Unloads a command.";
    usage = "unload <category:command name>";
    examples = ["unload info:help"];
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = false;
    cooldown = 0; // 0 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const [commandCategory, commandName] = args[0]?.split(":") ?? [null, null];
        if (!commandCategory || !commandName) {
            sendReply(ctx.client, `Usage: \`${this.usage}\``, ctx.msg);
            return;
        }

        if (await unloadCommand(ctx.client, commandCategory, commandName)) {
            sendReply(ctx.client, `✅ Unloaded \`${commandCategory}:${commandName}\``, ctx.msg);
        } else {
            sendReply(ctx.client, `❌ Couldn't unload \`${commandCategory}:${commandName}\``, ctx.msg);
        }
    }
}
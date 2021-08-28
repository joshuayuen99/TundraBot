import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

import { loadCommand } from "../../handlers/commands";

export default class Load implements Command {
    name = "load";
    category = "owner";
    description = "Loads a command.";
    usage = "load <category:command name>";
    examples = ["load info:help"];
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
            sendReply(ctx.client, `Usage: \`${this.usage}\`\nExamples:\n\`\`\`${this.examples.join("\n")}\`\`\``, ctx.msg);
            return;
        }

        if (await loadCommand(ctx.client, commandCategory, commandName)) {
            sendReply(ctx.client, `✅ Loaded \`${commandCategory}:${commandName}\``, ctx.msg);
        } else {
            sendReply(ctx.client, `❌ Couldn't load \`${commandCategory}:${commandName}\``, ctx.msg);
        }
    }
}
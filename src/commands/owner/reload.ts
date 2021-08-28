import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

import { loadCommand, unloadCommand } from "../../handlers/commands";

export default class Reload implements Command {
    name = "reload";
    category = "owner";
    description = "Reloads a command.";
    usage = "reload <category:command name>";
    examples = ["reload info:help"];
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = false;
    cooldown = 0; // 0 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const [commandCategory, commandName] = args[0]?.split(":") ?? [
            null,
            null,
        ];
        if (!commandCategory || !commandName) {
            sendReply(
                ctx.client,
                `Usage: \`${
                    this.usage
                }\`\nExamples:\n\`\`\`${this.examples.join("\n")}\`\`\``,
                ctx.msg
            );
            return;
        }

        if (
            (await unloadCommand(ctx.client, commandCategory, commandName)) &&
            (await loadCommand(ctx.client, commandCategory, commandName))
        ) {
            sendReply(ctx.client, `✅ Reloaded \`${commandCategory}:${commandName}\``, ctx.msg);
        } else {
            sendReply(
                ctx.client,
                `❌ Couldn't reload \`${commandCategory}:${commandName}\``,
                ctx.msg
            );
        }
    }
}

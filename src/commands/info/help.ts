import { Command, CommandContext } from "../../base/Command";

import { MessageEmbed, PermissionString } from "discord.js";
import { sendMessage } from "../../utils/functions";
import { stripIndents } from "common-tags";

export default class Help implements Command {
    name = "help";
    aliases = ["h", "commands"];
    category = "info";
    description =
        "Returns all commands, or detailed info about a specific command.";
    usage = "help [command | alias]";
    enabled = true;
    guildOnly = false;
    botPermissions: PermissionString[] = ["EMBED_LINKS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (args[0]) {
            this.getCommand(ctx, args[0]);
            return;
        } else {
            this.getAll(ctx);
            return;
        }
    }

    getAll(ctx: CommandContext): string {
        const embedMsg = new MessageEmbed()
            .setColor("RANDOM")
            .setDescription("**Commands**");

        // Get all the commands in a particular category
        const commands = (category) => {
            let commands = ctx.client.commands;
            // Make sure command is enabled
            commands = commands.filter((cmd) => cmd.enabled);

            // Get command per category
            commands = commands.filter((cmd) => cmd.category === category);

            // If DM, only get non guild commands
            if (!ctx.guild) {
                commands = commands.filter((cmd) => !cmd.guildOnly);
            }

            // Only show owner commands to owner
            if (ctx.author.id != process.env.OWNERID) {
                commands = commands.filter((cmd) => !cmd.ownerOnly);
            }

            return commands.map((cmd) => `- \`${cmd.name}\``).join("\n");
        };
        /*
        const info = client.categories
            .map(cat => stripIndents`**${cat[0].toUpperCase() + cat.slice(1)}** \n${commands(cat)}`)
            .reduce((string, category) => string + "\n" + category);
    
        return message.channel.send(embedMsg.setDescription(info));
        */
        ctx.client.categories.sort((a, b) => {
            const catgeoryOrder = [
                "info",
                "moderation",
                "music",
                "utility",
                "fun",
            ];

            if (!catgeoryOrder.includes(a)) return 1;
            else if (!catgeoryOrder.includes(b)) return -1;

            return catgeoryOrder.indexOf(a) - catgeoryOrder.indexOf(b);
        });

        ctx.client.categories.forEach((category) => {
            if (!commands(category)) return;
            embedMsg.addField(
                stripIndents`**${
                    category[0].toUpperCase() + category.slice(1)
                }**`,
                commands(category),
                true
            );
        });

        embedMsg.addField(
            "Detailed usage",
            `Type \`${ctx.guildSettings.prefix}help <command>\` to get detailed information about the given command.`
        );

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }

    getCommand(ctx: CommandContext, input: string): void {
        const embedMsg = new MessageEmbed();

        // Get the cmd from the commands list
        let cmd = ctx.client.commands.get(input.toLowerCase());
        if (!cmd) {
            // If the command wasn't found, check aliases
            cmd = ctx.client.commands.get(ctx.client.aliases.get(input.toLowerCase()));
        }

        if (!cmd) {
            // If the command still wasn't found
            const info = `No information found for command \`${input.toLowerCase()}\``;

            embedMsg.setColor("RED").setDescription(info);
            sendMessage(ctx.client, embedMsg, ctx.channel);
            return;
        }

        // Getting info for a guild only command
        if (!ctx.guild && cmd.guildOnly) {
            const info = `\`${input.toLowerCase()}\` can't be used in a DM`;

            embedMsg.setColor("RED").setDescription(info);
            sendMessage(ctx.client, embedMsg, ctx.channel);
            return;
        }

        // Non-owner getting info for an owner-only command
        if (cmd.ownerOnly && ctx.author.id != process.env.OWNERID) {
            const info = `\`${input.toLowerCase()}\` can only be used by my owners`;

            embedMsg.setColor("RED").setDescription(info);
            sendMessage(ctx.client, embedMsg, ctx.channel);
            return;
        }

        let info;
        if (cmd.name) info = `**Command name**: \`${cmd.name}\``; // Command name
        if (cmd.aliases)
            info += `\n**Aliases**: ${cmd.aliases
                .map((a) => `\`${a}\``)
                .join(", ")}`; // Aliases for the command
        if (cmd.description) info += `\n**Description**: ${cmd.description}`; // Description of the command
        if (cmd.usage) {
            // Shows the usage if it exists
            info += `\n**Usage**: ${cmd.usage}`;
            embedMsg.setFooter("Syntax: <> = required, [] = optional");
        }
        if (cmd.examples) {
            info += "\n**Examples**:";
            for (const example of cmd.examples) {
                info += `\n\`${example}\``;
            }
        }

        embedMsg.setColor("GREEN").setDescription(info);
        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}
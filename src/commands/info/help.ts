import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";

import {
    ApplicationCommandOption,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
} from "discord.js";
import { sendReply } from "../../utils/functions";
import { stripIndents } from "common-tags";

export default class Help implements Command {
    name = "help";
    aliases = ["h", "commands"];
    category = "info";
    description =
        "Displays all commands, or detailed info about a specific command.";
    usage = "help [command | alias]";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.EMBED_LINKS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription =
        "Displays all commands, or detailed info about a specific command";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "command",
            type: "STRING",
            description: "The command to get info about",
            required: false,
        },
    ];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (args[0]) {
            const embedMsg = this.getCommand(ctx, args[0]);
            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
            return;
        } else {
            const embedMsg = this.getAll(ctx);
            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
            return;
        }
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const command = ctx.commandInteraction.options.getString("command");

        if (command) {
            const embedMsg = this.getCommand(ctx, command);
            ctx.commandInteraction.reply({ embeds: [embedMsg] });
            return;
        } else {
            const embedMsg = this.getAll(ctx);
            ctx.commandInteraction.reply({ embeds: [embedMsg] });
            return;
        }
    }

    getAll(ctx: CommandContext | SlashCommandContext): MessageEmbed {
        const embedMsg = new MessageEmbed()
            .setColor("RANDOM")
            .setDescription("**Commands**");

        // Get all the commands in a particular category
        const commands = (category) => {
            let commands = ctx.client.commands;
            // Make sure command is enabled
            if (ctx instanceof CommandContext) {
                commands = commands.filter((cmd) => cmd.enabled);
            } else if (ctx instanceof SlashCommandContext) {
                commands = commands.filter((cmd) => cmd.slashCommandEnabled);
            }

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
        
        ctx.client.categories.sort((a, b) => {
            const catgeoryOrder = [
                "info",
                "moderation",
                "music",
                "utility",
                "fun",
                "owner",
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
            `Type \`${
                ctx instanceof CommandContext ? ctx.guildSettings.prefix : "/"
            }help <command>\` to get detailed information about the given command.`
        );

        return embedMsg;
    }

    getCommand(
        ctx: CommandContext | SlashCommandContext,
        input: string
    ): MessageEmbed {
        const embedMsg = new MessageEmbed();

        // Get the cmd from the commands list
        let cmd: Command;
        if (ctx instanceof CommandContext) {
            cmd = ctx.client.commands.get(input.toLowerCase());
            if (!cmd) {
                // If the command wasn't found, check aliases
                cmd = ctx.client.commands.get(
                    ctx.client.aliases.get(input.toLowerCase())
                );
            }
        } else if (ctx instanceof SlashCommandContext) {
            cmd = ctx.client.interactiveCommands.get(input.toLowerCase());
        }

        if (!cmd) {
            let info: string;
            if (
                ctx instanceof CommandContext &&
                ctx.client.interactiveCommands.get(input.toLowerCase())
            ) {
                info = `\`${input.toLowerCase()}\` is disabled as a regular command`;
            } else if (
                ctx instanceof SlashCommandContext &&
                (ctx.client.commands.get(input.toLowerCase()) ||
                    ctx.client.aliases.get(input.toLowerCase()))
            ) {
                info = `\`${input.toLowerCase()}\` is disabled as a slash command`;
            } else {
                // If the command still wasn't found
                info = `No information found for command \`${input.toLowerCase()}\``;
            }

            embedMsg.setColor("RED").setDescription(info);

            return embedMsg;
        }

        // Getting info for a guild only command
        if (!ctx.guild && cmd.guildOnly) {
            const info = `\`${input.toLowerCase()}\` can't be used in a DM`;

            embedMsg.setColor("RED").setDescription(info);
            return embedMsg;
        }

        // Non-owner getting info for an owner-only command
        if (cmd.ownerOnly && ctx.author.id != process.env.OWNERID) {
            const info = `\`${input.toLowerCase()}\` can only be used by my owners`;

            embedMsg.setColor("RED").setDescription(info);
            return embedMsg;
        }

        let info;
        if (cmd.name) info = `**Command name**: \`${cmd.name}\``; // Command name
        if (ctx instanceof CommandContext && cmd.aliases)
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

        return embedMsg;
    }
}

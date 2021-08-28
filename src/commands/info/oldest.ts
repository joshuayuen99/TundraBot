import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";

import {
    ApplicationCommandOption,
    GuildMember,
    MessageEmbed,
} from "discord.js";
import {
    formatDateShort,
    formatDateLong,
    sendReply,
} from "../../utils/functions";
import { stripIndents } from "common-tags";

export default class Oldest implements Command {
    name = "oldest";
    category = "info";
    description =
        "Displays information about the oldest member or user (account) of the server.";
    usage = "oldest <member | user | account>";
    examples = ["oldest member", "oldest user", "oldest account"];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription =
        "Displays information about the oldest member or user (account) of the server";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "target",
            type: "STRING",
            description: "The target to get info about",
            required: true,
            choices: [
                {
                    name: "Member",
                    value: "member",
                },
                {
                    name: "User",
                    value: "user",
                },
                {
                    name: "Account",
                    value: "account",
                },
            ],
        },
    ];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (!args[0]) {
            sendReply(ctx.client, `Usage: \`${this.usage}\``, ctx.msg);
            return;
        }

        let member = ctx.member;
        if (args[0] === "member") {
            let oldestDate = ctx.msg.createdAt;
            let oldestMember;
            await ctx.guild.members.fetch();
            ctx.guild.members.cache.forEach((member) => {
                if (
                    member.joinedAt < oldestDate &&
                    member.user.id !== ctx.guild.ownerId
                ) {
                    oldestDate = member.joinedAt;
                    oldestMember = member;
                }
            });
            member = oldestMember;
        } else if (args[0] === "user" || args[0] === "account") {
            let oldestDate = ctx.author.createdAt;
            let oldestMember = ctx.member;
            ctx.guild.members.cache.forEach((member) => {
                if (member.user.createdAt < oldestDate) {
                    oldestDate = member.user.createdAt;
                    oldestMember = member;
                }
            });
            member = oldestMember;
        }

        // Member variables
        const joined = formatDateLong(member.joinedAt);
        const roles =
            member.roles.cache
                .filter((r) => r.id !== ctx.guild.id) // Filters out the @everyone role
                .map((r) => r)
                .join(", ") || "none";

        // User variables
        const created = formatDateShort(member.user.createdAt);

        const embedMsg = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(
                member.displayHexColor === "#000000"
                    ? "#ffffff"
                    : member.displayHexColor
            )
            .setDescription(`${member}`)
            .setTimestamp()

            .addField(
                "Member information",
                stripIndents`**\\> Display name:** ${member.displayName}
            **\\> Joined the server:** ${joined}
            **\\> Roles: ** ${roles}`,
                true
            )

            .addField(
                "User information",
                stripIndents`**\\> ID:** ${member.user.id}
            **\\> Username:** ${member.user.username}
            **\\> Discord Tag:** ${member.user.tag}
            **\\> Created account:** ${created}`,
                true
            );

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const target = ctx.commandInteraction.options.getString("target");

        let member: GuildMember;
        if (target === "member") {
            let oldestDate = new Date();
            let oldestMember: GuildMember;
            await ctx.guild.members.fetch();
            ctx.guild.members.cache.forEach((member) => {
                if (
                    member.joinedAt < oldestDate &&
                    member.user.id !== ctx.guild.ownerId
                ) {
                    oldestDate = member.joinedAt;
                    oldestMember = member;
                }
            });
            member = oldestMember;
        } else if (target === "user" || target === "account") {
            let oldestDate = new Date();
            let oldestMember = ctx.member;
            ctx.guild.members.cache.forEach((member) => {
                if (member.user.createdAt < oldestDate) {
                    oldestDate = member.user.createdAt;
                    oldestMember = member;
                }
            });
            member = oldestMember;
        }

        // Member variables
        const joined = formatDateLong(member.joinedAt);
        const roles =
            member.roles.cache
                .filter((r) => r.id !== ctx.guild.id) // Filters out the @everyone role
                .map((r) => r)
                .join(", ") || "`none`";

        // User variables
        const created = formatDateShort(member.user.createdAt);

        const embedMsg = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(
                member.displayHexColor === "#000000"
                    ? "#ffffff"
                    : member.displayHexColor
            )
            .setDescription(`${member}`)
            .setTimestamp()

            .addField(
                "Member information",
                stripIndents`**\\> Display name:** ${member.displayName}
            **\\> Joined the server:** ${joined}
            **\\> Roles: ** ${roles}`,
                true
            )

            .addField(
                "User information",
                stripIndents`**\\> ID:** ${member.user.id}
            **\\> Username:** ${member.user.username}
            **\\> Discord Tag:** ${member.user.tag}
            **\\> Created account:** ${created}`,
                true
            );

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}

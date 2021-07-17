import { Command, CommandContext } from "../../base/Command";

import { MessageEmbed, PermissionString } from "discord.js";
import { getMember, formatDateShort, sendMessage } from "../../utils/functions";
import { stripIndents } from "common-tags";

export default class WhoIs implements Command {
    name = "whois";
    aliases = ["userinfo", "who"];
    category = "info";
    description =
        "Returns user information. If no one is specified, it will return user information about the person who used this command.";
    usage = "whois [username | id | mention]";
    examples = [];
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["EMBED_LINKS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const member = await getMember(ctx.msg, args.join(" "));

        // Member variables
        const joined = formatDateShort(member.joinedAt);
        const roles =
            member.roles.cache
                .filter((r) => r.id !== ctx.guild.id) // Filters out the @everyone role
                .map((r) => r)
                .join(", ") || "`none`";

        // User variables
        const created = formatDateShort(member.user.createdAt);
        const avatarURL = member.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(
                member.displayHexColor === "#000000"
                    ? "ffffff"
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
            **\\>** [Avatar link](${avatarURL})
            **\\> Created account:** ${created}`,
                true
            );

        // User activities
        for (const activity of member.user.presence.activities) {
            switch (activity.type) {
                case "PLAYING":
                    embedMsg.addField(
                        "Playing",
                        stripIndents`**\\>** ${activity.name}`
                    );
                    break;
                case "STREAMING":
                    embedMsg.addField(
                        `Streaming on ${activity.name}`,
                        stripIndents`**\\>** ${activity.state}
                **\\>** [${activity.details}](${activity.url})`
                    );
                    break;
                case "LISTENING":
                    embedMsg.addField(
                        `Listening to ${activity.name}`,
                        stripIndents`**\\> Song:** ${activity.details}
                **\\> Artist:** ${activity.state}`
                    );
                    break;
                case "WATCHING":
                    embedMsg.addField(
                        "Watching",
                        stripIndents`**\\>** ${activity.name}`
                    );
                    break;
                case "CUSTOM_STATUS":
                    let statusString = "";
                    if (activity.emoji) {
                        statusString += activity.emoji.name;
                        if (activity.state) {
                            statusString += ` ${activity.state}`;
                        }
                    } else statusString += activity.state;
                    embedMsg.addField(
                        "Custom status",
                        stripIndents`**\\>** ${statusString}`
                    );
                    break;
                default:
                    break;
            }
        }

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}

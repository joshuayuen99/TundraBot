import { CommandContext } from "../base/Command";
import { sendMessage } from "./functions";
import { MessageEmbed } from "discord.js";

/**
 * 
 * @param ctx command context
 * @returns true if bot has the necessary permissions, false otherwise
 */
export function validateBotPermissions(ctx: CommandContext): boolean {
    const missingPermissions = [];
    for (const permission of ctx.command.botPermissions) {
        if (!ctx.guild.me.hasPermission(permission)) {
            missingPermissions.push(permission);
        }
    }

    if (missingPermissions.length > 0) {
        const missingPermissionsString = missingPermissions.map((permission) => `\`${permission}\``).join(" ");
        
        let errorString = "";
        if (missingPermissions.length === 1) {
            errorString = `I must have the ${missingPermissionsString} permission to use this command. Contact your server admins to give me it.`;
        } else {
            errorString = `I must have the ${missingPermissionsString} permissions to use this command. Contact your server admins to give me them.`;
        }

        const embedMsg = new MessageEmbed()
            .setTitle(`${ctx.command.name} Error`)
            .setDescription(errorString)
            .setColor("RED")
            .setFooter(ctx.author.username, ctx.author.avatarURL());

        sendMessage(ctx.client, embedMsg, ctx.channel);

        return false;
    }
    
    return true;
}

/**
 * 
 * @param ctx command context
 * @returns true if member has the necessary permissions, false otherwise
 */
export function validateMemberPermissions(ctx: CommandContext): boolean {
    const missingPermissions = [];
    for (const permission of ctx.command.memberPermissions) {
        if (!ctx.member.hasPermission(permission)) {
            missingPermissions.push(permission);
        }
    }

    if (missingPermissions.length > 0) {
        const missingPermissionsString = missingPermissions.map((permission) => `\`${permission}\``).join(" ");
        
        let errorString = "";
        if (missingPermissions.length === 1) {
            errorString = `You must have the ${missingPermissionsString} permission to use this command.`;
        } else {
            errorString = `You must have the ${missingPermissionsString} permissions to use this command.`;
        }

        const embedMsg = new MessageEmbed()
            .setTitle(`${ctx.command.name} Error`)
            .setDescription(errorString)
            .setColor("RED")
            .setFooter(ctx.author.username, ctx.author.avatarURL());

        sendMessage(ctx.client, embedMsg, ctx.channel);

        return false;
    }
    
    return true;
}
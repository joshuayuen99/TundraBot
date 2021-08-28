import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { ApplicationCommandOption, GuildMember, MessageEmbed } from "discord.js";
import { sendMessage } from "../../utils/functions";
import { stripIndents } from "common-tags";
import { getMember } from "../../utils/functions";

const HEART = "💘";
const BROKENHEART = "💔";
const GROWINGHEART = "💗";

export default class Love implements Command {
    name = "love";
    category = "fun";
    description = "Calculates the love affinity you have with another user.";
    usage = "love [mention | id | username]";
    examples = [
        "love",
        "love @TundraBot",
        "love 647196546492006423",
        "love TundraBot",
    ];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Calculates the love affinity you have with another user";
    commandOptions: ApplicationCommandOption[] = [{
        name: "user",
        type: "USER",
        description: "Check this person's love for you",
        required: false,
    }];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        let person = await getMember(ctx.msg, args[0]);

        if (!person || ctx.author.id === person.id) {
            person = ctx.guild.members.cache
                .filter((m) => m.id != ctx.author.id)
                .random();
        }

        const love = Math.random() * 100;
        const loveIndex = Math.round(love / 10);
        const loveLevel =
            HEART.repeat(loveIndex) + BROKENHEART.repeat(10 - loveIndex);

        const embedMsg = new MessageEmbed()
            .setColor("#ffb6c1")
            .setThumbnail(person.user.displayAvatarURL())
            .addField(
                stripIndents`**${person.displayName}** loves **${ctx.member.displayName}** this much:`,
                `${GROWINGHEART}: ${Math.round(love)}%
            
            
            ${loveLevel}`
            );

        sendMessage(ctx.client, { embeds: [embedMsg] }, ctx.channel);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        let member = ctx.commandInteraction.options.getMember("user") as GuildMember;
        
        if (!member || ctx.author.id === member.id) {
            member = ctx.guild.members.cache
                .filter((m) => m.id != ctx.author.id)
                .random();
        }

        const love = Math.random() * 100;
        const loveIndex = Math.round(love / 10);
        const loveLevel =
            HEART.repeat(loveIndex) + BROKENHEART.repeat(10 - loveIndex);

        const embedMsg = new MessageEmbed()
            .setColor("#ffb6c1")
            .setThumbnail(member.user.displayAvatarURL())
            .addField(
                stripIndents`**${member.displayName}** loves **${ctx.member.displayName}** this much:`,
                `${GROWINGHEART}: ${Math.round(love)}%
            
            
            ${loveLevel}`
            );

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}

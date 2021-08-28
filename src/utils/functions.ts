import {
    ButtonInteraction,
    CollectorFilter,
    CreateRoleOptions,
    Guild,
    GuildChannel,
    GuildMember,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageOptions,
    MessagePayload,
    MessageReaction,
    OverwriteResolvable,
    Permissions,
    ReplyMessageOptions,
    Role,
    TextChannel,
    ThreadChannel,
    User,
} from "discord.js";
import moment from "moment";
import { CommandContext } from "../base/Command";
import { TundraBot } from "../base/TundraBot";
import Logger from "./logger";

export async function getMember(
    message: Message,
    toFind = ""
): Promise<GuildMember> {
    await message.guild.members.fetch();

    toFind = toFind.toLowerCase();

    let target = message.guild.members.cache.find(
        (member) => member.toString() == toFind
    );

    // If there is no target, but there is a mention in the message, use the first mention instead
    if (!target && message.mentions.members) {
        target = message.mentions.members.first();
    }

    // Searches for people in the server with a matching nickname or "name#tag"
    if (!target && toFind) {
        target = message.guild.members.cache.find((member) => {
            return (
                member.displayName.toLowerCase().includes(toFind) ||
                member.user.tag.toLowerCase().includes(toFind)
            );
        });
    }

    // Search for ID
    if (!target && toFind) {
        target = message.guild.members.cache.get(toFind);
    }

    // If no one is found that matches, return the callee
    if (!target) {
        target = message.member;
    }

    return target;
}

export async function getTextChannel(
    guild: Guild,
    toFind: string
): Promise<TextChannel | void> {
    toFind = toFind.toLowerCase();

    let channel;
    channel = guild.channels.cache.find(
        (channel) =>
            `<#${channel.id}>` === toFind && channel.type === "GUILD_TEXT"
    );
    if (channel) return channel;

    channel = guild.channels.cache.find(
        (channel) =>
            channel.name.toLowerCase() === toFind &&
            channel.type === "GUILD_TEXT"
    );
    if (channel) return channel;
    else return;
}

export async function getRole(
    guild: Guild,
    toFind: string
): Promise<Role | void> {
    toFind = toFind.toLowerCase();

    await guild.roles.fetch();

    let role;
    role = guild.roles.cache.find((role) => role.name === toFind);
    if (role) return role;

    role = guild.roles.cache.find((role) => role.toString() === toFind);
    if (role) return role;
    else return;
}

export async function createChannel(
    guild: Guild,
    name: string,
    permissions: OverwriteResolvable[]
): Promise<TextChannel> {
    if (
        guild.channels.cache.some(
            (channel) => channel.type === "GUILD_TEXT" && channel.name === name
        )
    ) {
        return guild.channels.cache.find(
            (channel) => channel.type === "GUILD_TEXT" && channel.name === name
        ) as TextChannel;
    }

    if (guild.me.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
        return guild.channels.create(name, {
            type: "GUILD_TEXT",
            permissionOverwrites: permissions,
        }) as Promise<TextChannel>;
    }

    return;
}

export async function createRole(
    guild: Guild,
    createRoleOptions: CreateRoleOptions,
): Promise<Role> {
    if (guild.roles.cache.some((role) => role.name === createRoleOptions.name)) {
        return guild.roles.cache.find((role) => role.name === createRoleOptions.name);
    }

    if (guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
        return guild.roles.create(createRoleOptions);
    }

    return;
}

export function formatDateShort(date: Date): string {
    const momentDate = moment(date);
    const discordDate = `<t:${momentDate.unix()}:D>`;

    return discordDate;
}

export function formatDateLong(date: Date): string {
    const momentDate = moment(date);
    const discordDate = `<t:${momentDate.unix()}:F>`;

    return discordDate;
}

export function generateMessageLink(message: Message): string {
    return `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
}

export async function commandConfirmMessage(
    ctx: CommandContext,
    description: string
): Promise<boolean> {
    const promptEmbed = new MessageEmbed()
        .setColor("GREEN")
        .setAuthor("This verification becomes invalid after 30s")
        .setDescription(description);

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("confirm")
            .setLabel("Confirm")
            .setStyle("SUCCESS"),
        new MessageButton()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle("DANGER")
    );

    const embedMessage = await sendMessage(
        ctx.client,
        {
            embeds: [promptEmbed],
            components: [row],
        },
        ctx.channel
    );
    if (!embedMessage) return false;

    const filter: CollectorFilter<[ButtonInteraction]> = (button) =>
        button.user.id === ctx.author.id;

    return embedMessage
        .awaitMessageComponent({
            filter: filter,
            componentType: "BUTTON",
            time: 30 * 1000,
        })
        .then((collected) => {
            if (embedMessage.deletable) embedMessage.delete();
            return collected.customId === "confirm" ? true : false;
        })
        .catch(() => {
            if (embedMessage.deletable) embedMessage.delete();
            return false;
        });
}

/**
 *
 * @param message message to add emojis to
 * @param author user to prompt
 * @param time time to prompt the user for in seconds
 * @param validReactions valid emoji reactions
 * @returns
 */
export async function promptMessage(
    client: TundraBot,
    message: Message,
    author: User,
    time: number,
    validReactions: string[]
): Promise<string | void> {
    time *= 1000; // Convert from s to ms

    if (!message.guild.me.permissions.has(Permissions.FLAGS.ADD_REACTIONS)) {
        return;
    }

    async function setReactions() {
        for (const reaction of validReactions) {
            await message.react(reaction);
        }
    }

    await setReactions().catch((err) => {
        sendMessage(
            client,
            "I had trouble reacting with those emojis...",
            <TextChannel>message.channel
        );
        Logger.log("error", `promptMessage error:\n${err}`);
    });

    const filter: CollectorFilter<[MessageReaction, User]> = (reaction, user) =>
        validReactions.includes(reaction.emoji.name) && user.id === author.id;

    return message
        .awaitReactions({ filter, max: 1, time: time })
        .then((collected) => collected.first() && collected.first().emoji.name)
        .catch((err) => {
            Logger.log("error", `Error in promptMessage:\n${err}`);
        });
}

/**
 *
 * @param client
 * @param message
 * @param author
 * @param time time in seconds
 * @returns
 */
export async function waitResponse(
    client: TundraBot,
    channel: TextChannel | ThreadChannel,
    author: User,
    time: number
): Promise<Message | void> {
    client.waitingResponse.add(author.id);
    time *= 1000; // Convert from s to ms

    const filter: CollectorFilter<[Message]> = (msg) =>
        msg.author.id === author.id;

    return channel
        .awaitMessages({ filter, max: 1, time: time })
        .then((collected) => {
            client.waitingResponse.delete(author.id);
            return collected.first();
        })
        .catch((err) => {
            Logger.log("error", `Error in waitResponse:\n${err}`);
        });
}

export async function sendMessage(
    client: TundraBot,
    message: string | MessagePayload | MessageOptions,
    channel: TextChannel | ThreadChannel
): Promise<Message | void> {
    if (!channel) return;

    if (
        channel instanceof GuildChannel &&
        !(
            channel
                .permissionsFor(client.user)
                .has(Permissions.FLAGS.VIEW_CHANNEL) &&
            channel
                .permissionsFor(client.user)
                .has(Permissions.FLAGS.SEND_MESSAGES)
        )
    )
        return;

    return channel.send(message).catch((err) => {
        Logger.log("error", `sendMessage error:\n${err}`);
    });
}

export async function sendReply(
    client: TundraBot,
    reply: string | MessagePayload | ReplyMessageOptions,
    message: Message
): Promise<Message | void> {
    if (
        message.channel instanceof GuildChannel &&
        !(
            (<TextChannel>message.channel)
                .permissionsFor(client.user)
                .has(Permissions.FLAGS.VIEW_CHANNEL) &&
            (<TextChannel>message.channel)
                .permissionsFor(client.user)
                .has(Permissions.FLAGS.SEND_MESSAGES)
        )
    )
        return;

    return message.reply(reply).catch((err) => {
        Logger.log("error", `sendReply error:\n${err}`);
    });
}

/**
 *
 * @param str HH:MM:SS formatted string
 * @returns total seconds of input string
 */
export function hmsToSeconds(str: string): number {
    return +str.split(":").reduce((acc, time) => {
        return (60 * +acc + +time).toString();
    });
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shuffle(a: any[]): any[] {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApplicationCommandOption, CommandInteraction, Guild, GuildMember, Message, PermissionResolvable, TextChannel, User } from "discord.js";
import { guildInterface } from "../models/Guild";
import { TundraBot } from "./TundraBot";

export abstract class Command {
    name: string;
    aliases?: string[];
    category: string;
    description: string;
    usage: string;
    examples?: string[];
    enabled = true;
    slashCommandEnabled? = false;
    guildOnly: boolean;
    botPermissions: PermissionResolvable[];
    memberPermissions: PermissionResolvable[];
    ownerOnly = false;
    premiumOnly = false;
    cooldown: number; // milliseconds
    slashDescription?: string;
    commandOptions?: ApplicationCommandOption[] = [];

    abstract execute(ctx: CommandContext, args: string[]): Promise<any | void>;

    slashCommandExecute?(ctx: SlashCommandContext): Promise<any | void>;

    shutdown?(): Promise<any | void>;
}

export class CommandContext {
    command: Command;
    msg: Message;
    member?: GuildMember;
    guild?: Guild;
    channel: TextChannel;
    author: User;
    client: TundraBot;
    guildSettings: Partial<guildInterface>;

    constructor(client: TundraBot, command: Command, guildSettings: Partial<guildInterface>, msg: Message) {
        this.command = command;
        this.msg = msg;
        this.member = msg.member;
        this.channel = msg.channel as TextChannel;
        this.guild = msg.guild;
        this.author = msg.author;
        this.client = client;
        this.guildSettings = guildSettings;
    }
}

export class SlashCommandContext {
    command: Command;
    commandInteraction: CommandInteraction;
    member?: GuildMember;
    guild?: Guild;
    channel: TextChannel;
    author: User;
    client: TundraBot;
    guildSettings: Partial<guildInterface>;

    constructor(client: TundraBot, command: Command, guildSettings: Partial<guildInterface>, interaction: CommandInteraction) {
        this.command = command;
        this.commandInteraction = interaction;
        this.member = interaction.member instanceof GuildMember ? interaction.member : null;
        this.channel = interaction.channel as TextChannel;
        this.guild = interaction.guild;
        this.author = interaction.user;
        this.client = client;
        this.guildSettings = guildSettings;
    }
}